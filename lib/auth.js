import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";

export const authOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username
          }
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          username: user.username,
          role: user.role,
          storeName: user.storeName,
          storeCode: user.storeCode
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.storeName = user.storeName;
        token.storeCode = user.storeCode;
        return token;
      }

      if (token.id) {
        const latestUser = await prisma.user.findUnique({
          where: {
            id: Number(token.id)
          },
          select: {
            id: true,
            username: true,
            role: true,
            storeName: true,
            storeCode: true
          }
        });

        if (latestUser) {
          token.id = String(latestUser.id);
          token.username = latestUser.username;
          token.role = latestUser.role;
          token.storeName = latestUser.storeName;
          token.storeCode = latestUser.storeCode;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.storeName = token.storeName;
      session.user.storeCode = token.storeCode;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
