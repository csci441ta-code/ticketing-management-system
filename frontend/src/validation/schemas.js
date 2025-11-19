import * as yup from 'yup';

export const ticketSchema = yup.object({
  title: yup.string().required('Ticket title is required'),
  description: yup.string().min(10, 'Description must be at least 10 characters').required('Description is required'),
  priority: yup.string().required('Please select a priority level'),
});

export const registerSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});
