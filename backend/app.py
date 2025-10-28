from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_pymongo import PyMongo
from bson import ObjectId
from datetime import datetime, timedelta
import os
from functools import wraps
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['MONGO_URI'] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/tutortrack')

CORS(app, resources={r"/api/*": {"origins": "*"}})
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
mongo = PyMongo(app)

# Collections
users_collection = mongo.db.users
sessions_collection = mongo.db.sessions
ratings_collection = mongo.db.ratings

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    if 'created_at' in doc and isinstance(doc['created_at'], datetime):
        doc['created_at'] = doc['created_at'].isoformat()
    if 'updated_at' in doc and isinstance(doc['updated_at'], datetime):
        doc['updated_at'] = doc['updated_at'].isoformat()
    return doc

# Safe ObjectId parser to avoid crashes on invalid ids
def to_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None

# Role decorator
def role_required(roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            oid = to_object_id(user_id)
            if not oid:
                return jsonify({'error': 'Invalid user id'}), 400
            user = users_collection.find_one({'_id': oid})
            if not user or user.get('role') not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# ============ AUTH ENDPOINTS ============

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    
    # Validate required fields
    required_fields = ['email', 'password', 'name', 'role']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user exists
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'error': 'Email already exists'}), 400
    
    # Hash password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create user
    # Normalize subject_expertise to list of strings if tutor provides comma-separated string
    subject_expertise = data.get('subject_expertise', [])
    if isinstance(subject_expertise, str):
        subject_expertise = [s.strip() for s in subject_expertise.split(',') if s.strip()]

    user = {
        'email': data['email'],
        'password': hashed_password,
        'name': data['name'],
        'role': data['role'],
        'department': data.get('department', ''),
        'year_of_study': data.get('year_of_study'),
        'subject_expertise': subject_expertise,
        'availability_status': data.get('availability_status', 'available'),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = users_collection.insert_one(user)
    user['_id'] = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(identity=str(result.inserted_id))
    
    return jsonify({
        'user': serialize_doc(user),
        'token': access_token
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    user = users_collection.find_one({'email': data['email']})
    
    if not user or not bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user['_id']))
    
    return jsonify({
        'user': serialize_doc(user),
        'token': access_token
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    oid = to_object_id(user_id)
    if not oid:
        return jsonify({'error': 'Invalid user id'}), 400
    user = users_collection.find_one({'_id': oid})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': serialize_doc(user)}), 200

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    # JWT tokens are stateless, so logout is handled client-side
    # This endpoint exists for API completeness
    return jsonify({'message': 'Logged out successfully'}), 200

# ============ USER/PROFILE ENDPOINTS ============

@app.route('/api/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    oid = to_object_id(user_id)
    if not oid:
        return jsonify({'error': 'Invalid user id'}), 400
    user = users_collection.find_one({'_id': oid})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(serialize_doc(user)), 200

@app.route('/api/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    
    # Users can only update their own profile unless admin
    if current_user_id != user_id:
        current_oid = to_object_id(current_user_id)
        if not current_oid:
            return jsonify({'error': 'Invalid user id'}), 400
        current_user = users_collection.find_one({'_id': current_oid})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    update_fields = {
        'updated_at': datetime.utcnow()
    }
    
    allowed_fields = ['name', 'department', 'year_of_study', 'subject_expertise', 'availability_status']
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]
    
    target_oid = to_object_id(user_id)
    if not target_oid:
        return jsonify({'error': 'Invalid user id'}), 400
    users_collection.update_one(
        {'_id': target_oid},
        {'$set': update_fields}
    )
    
    updated_user = users_collection.find_one({'_id': target_oid})
    return jsonify(serialize_doc(updated_user)), 200

@app.route('/api/tutors', methods=['GET'])
@jwt_required()
def get_tutors():
    tutors = list(users_collection.find({'role': 'tutor'}))
    return jsonify([serialize_doc(tutor) for tutor in tutors]), 200

# ============ SESSION ENDPOINTS ============

@app.route('/api/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    user_id = get_jwt_identity()
    oid = to_object_id(user_id)
    if not oid:
        return jsonify({'error': 'Invalid user id'}), 400
    user = users_collection.find_one({'_id': oid})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Filter based on role
    query = {}
    if user['role'] == 'student':
        query['student_id'] = user_id
    elif user['role'] == 'tutor':
        query['tutor_id'] = user_id
    # Admins see all sessions
    
    sessions = list(sessions_collection.find(query))
    
    # Populate tutor and student info
    for session in sessions:
        if 'tutor_id' in session:
            tid = to_object_id(session['tutor_id'])
            tutor = users_collection.find_one({'_id': tid}) if tid else None
            session['tutor'] = serialize_doc(tutor) if tutor else None
        if 'student_id' in session:
            sid = to_object_id(session['student_id'])
            student = users_collection.find_one({'_id': sid}) if sid else None
            session['student'] = serialize_doc(student) if student else None
    
    return jsonify([serialize_doc(session) for session in sessions]), 200

@app.route('/api/sessions', methods=['POST'])
@jwt_required()
def create_session():
    user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields for session
    required = ['tutor_id', 'subject_name', 'date', 'time', 'duration']
    missing = [field for field in required if field not in data]
    if missing:
        print(f"DEBUG: Missing fields: {missing}, Received data keys: {list(data.keys())}")
        return jsonify({'error': f'Missing required fields: {missing}'}), 400
    
    session = {
        'student_id': user_id,
        'tutor_id': data['tutor_id'],
        'subject_name': data['subject_name'],
        'date': data['date'],
        'time': data['time'],
        'duration': data['duration'],
        'location': data.get('location', ''),
        'status': 'pending',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = sessions_collection.insert_one(session)
    session['_id'] = str(result.inserted_id)
    
    return jsonify(serialize_doc(session)), 201

@app.route('/api/sessions/<session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    user_id = get_jwt_identity()
    user_oid = to_object_id(user_id)
    sess_oid = to_object_id(session_id)
    if not user_oid or not sess_oid:
        return jsonify({'error': 'Invalid id'}), 400
    user = users_collection.find_one({'_id': user_oid})
    session = sessions_collection.find_one({'_id': sess_oid})
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Check permissions
    if user['role'] not in ['admin', 'tutor'] and session['student_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    update_fields = {
        'updated_at': datetime.utcnow()
    }
    
    allowed_fields = ['status', 'subject_name', 'date', 'time', 'duration', 'location']
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]
    
    sessions_collection.update_one(
        {'_id': sess_oid},
        {'$set': update_fields}
    )
    
    updated_session = sessions_collection.find_one({'_id': sess_oid})
    return jsonify(serialize_doc(updated_session)), 200

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    user_id = get_jwt_identity()
    user_oid = to_object_id(user_id)
    sess_oid = to_object_id(session_id)
    if not user_oid or not sess_oid:
        return jsonify({'error': 'Invalid id'}), 400
    user = users_collection.find_one({'_id': user_oid})
    session = sessions_collection.find_one({'_id': sess_oid})
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Only admin or session owner can delete
    if user['role'] != 'admin' and session['student_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    sessions_collection.delete_one({'_id': sess_oid})
    return jsonify({'message': 'Session deleted'}), 200

# ============ RATING ENDPOINTS ============

@app.route('/api/ratings', methods=['GET'])
@jwt_required()
def get_ratings():
    tutor_id = request.args.get('tutor_id')
    query = {}
    
    if tutor_id:
        query['tutor_id'] = tutor_id
    
    ratings = list(ratings_collection.find(query))
    return jsonify([serialize_doc(rating) for rating in ratings]), 200

@app.route('/api/ratings', methods=['POST'])
@jwt_required()
def create_rating():
    user_id = get_jwt_identity()
    data = request.json
    
    if not all(field in data for field in ['session_id', 'tutor_id', 'value']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if session exists and is completed
    sess_oid = to_object_id(data['session_id'])
    if not sess_oid:
        return jsonify({'error': 'Invalid session id'}), 400
    session = sessions_collection.find_one({'_id': sess_oid})
    if not session or session['status'] != 'completed':
        return jsonify({'error': 'Can only rate completed sessions'}), 400
    
    # Check if already rated
    existing_rating = ratings_collection.find_one({
        'session_id': data['session_id'],
        'student_id': user_id
    })
    if existing_rating:
        return jsonify({'error': 'Session already rated'}), 400
    
    rating = {
        'session_id': data['session_id'],
        'tutor_id': data['tutor_id'],
        'student_id': user_id,
        'value': data['value'],
        'feedback': data.get('feedback', ''),
        'created_at': datetime.utcnow()
    }
    
    result = ratings_collection.insert_one(rating)
    rating['_id'] = str(result.inserted_id)
    
    return jsonify(serialize_doc(rating)), 201

@app.route('/api/ratings/<rating_id>', methods=['PUT'])
@jwt_required()
def update_rating(rating_id):
    user_id = get_jwt_identity()
    rid = to_object_id(rating_id)
    if not rid:
        return jsonify({'error': 'Invalid rating id'}), 400
    rating = ratings_collection.find_one({'_id': rid})
    
    if not rating:
        return jsonify({'error': 'Rating not found'}), 404
    
    # Only the student who created the rating can update it
    if rating['student_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    update_fields = {}
    
    allowed_fields = ['value', 'feedback']
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]
    
    ratings_collection.update_one(
        {'_id': rid},
        {'$set': update_fields}
    )
    
    updated_rating = ratings_collection.find_one({'_id': rid})
    return jsonify(serialize_doc(updated_rating)), 200

# ============ ADMIN ENDPOINTS ============

@app.route('/api/admin/users', methods=['GET'])
@role_required(['admin'])
def admin_get_users():
    users = list(users_collection.find({}))
    return jsonify([serialize_doc(user) for user in users]), 200

@app.route('/api/admin/stats', methods=['GET'])
@role_required(['admin'])
def admin_get_stats():
    stats = {
        'total_users': users_collection.count_documents({}),
        'total_students': users_collection.count_documents({'role': 'student'}),
        'total_tutors': users_collection.count_documents({'role': 'tutor'}),
        'total_sessions': sessions_collection.count_documents({}),
        'pending_sessions': sessions_collection.count_documents({'status': 'pending'}),
        'completed_sessions': sessions_collection.count_documents({'status': 'completed'}),
        'total_ratings': ratings_collection.count_documents({})
    }
    return jsonify(stats), 200

@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@role_required(['admin'])
def admin_delete_user(user_id):
    uid = to_object_id(user_id)
    if not uid:
        return jsonify({'error': 'Invalid user id'}), 400
    user = users_collection.find_one({'_id': uid})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Delete user and all related data
    users_collection.delete_one({'_id': uid})
    sessions_collection.delete_many({
        '$or': [
            {'student_id': user_id},
            {'tutor_id': user_id}
        ]
    })
    ratings_collection.delete_many({
        '$or': [
            {'student_id': user_id},
            {'tutor_id': user_id}
        ]
    })
    
    return jsonify({'message': 'User and related data deleted'}), 200

@app.route('/api/admin/ratings', methods=['GET'])
@role_required(['admin'])
def admin_get_ratings():
    ratings = list(ratings_collection.find({}))

    enriched = []
    for r in ratings:
        r["_id"] = str(r["_id"])
        student = users_collection.find_one({"_id": to_object_id(r.get("student_id"))})
        tutor = users_collection.find_one({"_id": to_object_id(r.get("tutor_id"))})
        r["student"] = {"name": student.get("name", "Unknown")} if student else {"name": "Unknown"}
        r["tutor"] = {"name": tutor.get("name", "Unknown")} if tutor else {"name": "Unknown"}
        enriched.append(r)

    return jsonify(enriched), 200

@app.route('/api/admin/ratings/<rating_id>', methods=['DELETE'])
@role_required(['admin'])
def admin_delete_rating(rating_id):
    rid = to_object_id(rating_id)
    if not rid:
        return jsonify({'error': 'Invalid rating id'}), 400
    rating = ratings_collection.find_one({'_id': rid})
    
    if not rating:
        return jsonify({'error': 'Rating not found'}), 404
    
    ratings_collection.delete_one({'_id': rid})
    return jsonify({'message': 'Rating deleted'}), 200

# ============ HEALTH CHECK ============

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'TutorTrack API is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
