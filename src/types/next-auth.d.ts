import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    entraSubject?: string;
    entraTenantId?: string;
  }

  interface Session {
    user: {
      entraSubject?: string;
      entraTenantId?: string;
    } & Session["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    entraSubject?: string;
    entraTenantId?: string;
  }
}
