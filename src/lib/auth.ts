import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './db';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error('No account found with this email.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          // Register failed audit log
          await prisma.loginHistory.create({
            data: {
              userId: user.id,
              status: 'FAILED',
              device: 'Web Browser',
              ipAddress: '127.0.0.1'
            }
          });
          throw new Error('Incorrect password.');
        }

        // Register successful audit log
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            status: 'SUCCESS',
            device: 'Web Browser',
            ipAddress: '127.0.0.1'
          }
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          photo: user.photo,
          gender: user.gender,
          dob: user.dob,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.photo = user.photo;
        token.gender = user.gender;
        token.dob = user.dob;
      }
      // Handle session updates (e.g. photo update or profile edit)
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string | null;
        session.user.photo = token.photo as string | null;
        session.user.gender = token.gender as string | null;
        session.user.dob = token.dob as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
