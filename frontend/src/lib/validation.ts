import { z } from 'zod';

// Validation schemas for forms
export const sessionRequestSchema = z.object({
  subject: z.string()
    .trim()
    .min(1, 'Subject is required')
    .max(100, 'Subject must be less than 100 characters'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  duration: z.number()
    .int('Duration must be a whole number')
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must be less than 480 minutes'),
  location: z.string()
    .trim()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters'),
});

export const ratingSchema = z.object({
  rating: z.number()
    .int()
    .min(1, 'Please select a rating')
    .max(5, 'Rating must be between 1 and 5'),
  feedback: z.string()
    .trim()
    .max(1000, 'Feedback must be less than 1000 characters')
    .optional(),
});

export const signupSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'tutor']),
  department: z.string()
    .trim()
    .max(100, 'Department must be less than 100 characters')
    .optional(),
  year_of_study: z.number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .nullable(),
  subject_expertise: z.string()
    .trim()
    .max(200, 'Subject expertise must be less than 200 characters')
    .optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required'),
});

export const tutorProfileSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  department: z.string()
    .trim()
    .max(100, 'Department must be less than 100 characters')
    .optional()
    .nullable(),
  subject_expertise: z.string()
    .trim()
    .max(200, 'Subject expertise must be less than 200 characters')
    .optional()
    .nullable(),
  availability_status: z.string()
    .trim()
    .max(100, 'Availability status must be less than 100 characters')
    .optional()
    .nullable(),
});
