export type Profile = {
  id: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export type Request = {
  id: string
  receipt_no: string
  user_id: string
  request_type: 'test' | 'consulting' | 'development'
  org_name: string
  manager_name: string
  manager_phone: string
  manager_email: string
  title: string
  description: string
  desired_start: string
  desired_end: string
  status: 'new' | 'confirmed'
  created_at: string
  updated_at: string
}

export type StatusHistory = {
  id: string
  request_id: string
  prev_status: string | null
  new_status: string
  changed_by: string | null
  changed_at: string
}
