import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

//1. These gaurds are used to implement role-based access control in NestJS applications. 
//.  They can be applied to routes or controllers to restrict access based on user roles.

//2. Gaurds will run after the middleware and before the route handler. 
//   They can access the request object and determine whether the user has the necessary permissions to access the requested resource.


@Injectable()
export class RolesGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        if(request.user && request.user.role === 'admin') {
            return true; // Allow access if the user is an admin
        }
        return false; // Deny access for non-admin users
    }
}