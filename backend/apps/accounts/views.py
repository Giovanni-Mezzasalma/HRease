# backend/apps/accounts/views.py

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, PasswordResetSerializer, SetPasswordSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that returns user data alongside tokens
    """
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(APIView):
    """
    Get and update user profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'status': 'success',
            'data': serializer.data
        })
    
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'status': 'success',
                'data': serializer.data
            })
        return Response({
            'status': 'error',
            'message': serializer.errors,
            'code': 'VALIDATION_ERROR'
        }, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    """
    Request a password reset email
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                # Generate token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Create reset URL (frontend url)
                reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
                
                # Send email
                context = {
                    'user': user,
                    'reset_url': reset_url,
                    'site_name': 'HRease'
                }
                
                email_subject = "Reset your password"
                email_body = render_to_string('password_reset_email.html', context)
                
                send_mail(
                    email_subject,
                    email_body,
                    settings.EMAIL_HOST_USER,
                    [user.email],
                    fail_silently=False,
                    html_message=email_body
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Password reset email sent'
                })
            except User.DoesNotExist:
                # Returning success even if user doesn't exist for security
                return Response({
                    'status': 'success',
                    'message': 'Password reset email sent'
                })
                
        return Response({
            'status': 'error',
            'message': serializer.errors,
            'code': 'VALIDATION_ERROR'
        }, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token and set new password
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            uid = serializer.validated_data['uid']
            token = serializer.validated_data['token']
            password = serializer.validated_data['new_password']
            
            try:
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=user_id)
                
                if default_token_generator.check_token(user, token):
                    user.set_password(password)
                    user.save()
                    return Response({
                        'status': 'success',
                        'message': 'Password reset successful'
                    })
                else:
                    return Response({
                        'status': 'error',
                        'message': 'Invalid or expired token',
                        'code': 'INVALID_TOKEN'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({
                    'status': 'error',
                    'message': 'Invalid user ID',
                    'code': 'INVALID_UID'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        return Response({
            'status': 'error',
            'message': serializer.errors,
            'code': 'VALIDATION_ERROR'
        }, status=status.HTTP_400_BAD_REQUEST)