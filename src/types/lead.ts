export interface Lead {
  id: string;
  nombre_completo: string;
  empresa: string;
  email: string;
  telefono: string;
  direccion?: string;
  codigo_postal?: string;
  created_at: string;
  token_sesion: string;
}

export interface LeadFormData {
  nombre_completo: string;
  empresa: string;
  email: string;
  telefono: string;
  direccion?: string;
  codigo_postal?: string;
}
