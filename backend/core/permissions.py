from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):

    message = "Only customers can perform this action."

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "profile", None)

        return (
            profile is not None
            and profile.role == "customer"
        )


class IsShooter(BasePermission):

    message = "Only shooters can perform this action."

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "profile", None)

        return (
            profile is not None
            and profile.role == "shooter"
        )


class IsOwnerOrReadOnly(BasePermission):

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):

        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        if hasattr(obj, "user"):
            return obj.user.user == request.user

        return False