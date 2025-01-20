/*
  # Create Demo User

  1. Changes
    - Create a demo user account with email demo@example.com
    - Set up initial authentication

  Note: The password will be 'demo123'
*/

-- Create the demo user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'demo@example.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Insert into public.users table
DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Get the ID of the auth user we just created
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'demo@example.com'
  LIMIT 1;

  -- Insert into public.users if not exists
  INSERT INTO public.users (id, email, username)
  VALUES (auth_user_id, 'demo@example.com', 'demo')
  ON CONFLICT DO NOTHING;
END $$;