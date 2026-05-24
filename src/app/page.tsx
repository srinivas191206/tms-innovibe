import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function IndexPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role;

  if (role === 'ADMIN') {
    redirect('/admin');
  } else if (role === 'DEPT_HEAD') {
    redirect('/head');
  } else {
    redirect('/employee');
  }
}
