import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirigir a productos por defecto
  redirect('/admin/productos');
}
