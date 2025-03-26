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
    View personalizzata per l'ottenimento del token JWT.
    Estende il TokenObtainPairView standard di DRF-SimpleJWT.
    Restituisce i token di accesso e refresh insieme ai dati dell'utente.
    """
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(APIView):
    """
    Gestisce le operazioni relative al profilo dell'utente autenticato.
    Consente di recuperare e aggiornare i dati del profilo utente.
    
    Richiede autenticazione per tutte le operazioni.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Recupera i dati del profilo dell'utente corrente.
        
        Returns:
            Response: Dati del profilo serializzati
        """
        serializer = UserSerializer(request.user)
        return Response({
            'status': 'success',
            'data': serializer.data
        })
    
    def patch(self, request):
        """
        Aggiorna parzialmente i dati del profilo dell'utente corrente.
        
        Args:
            request: Contiene i campi da aggiornare
            
        Returns:
            Response: Dati del profilo aggiornati in caso di successo
                     Errori di validazione in caso di fallimento
        """
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
    Gestisce le richieste di reset della password.
    Invia un'email con un token di reset quando un utente dimentica la password.
    
    Non richiede autenticazione per consentire agli utenti non loggati di 
    reimpostare la propria password.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Gestisce la richiesta di reset della password.
        
        1. Convalida l'email fornita
        2. Genera un token sicuro univoco
        3. Invia un'email con il link di reset
        
        Args:
            request: Contiene l'email dell'utente
            
        Returns:
            Response: Messaggio di successo (anche se l'utente non esiste, per sicurezza)
                     Errori di validazione in caso di fallimento
        
        Note:
            Per motivi di sicurezza, restituisce sempre un messaggio di successo
            anche se l'email non è associata a nessun utente.
        """
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
    Gestisce la conferma del reset della password.
    Consente agli utenti di impostare una nuova password utilizzando il token inviato via email.
    
    Non richiede autenticazione perché viene utilizzato nel processo di recupero password.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Conferma il reset della password e imposta la nuova password.
        
        1. Verifica la validità del token e dell'uid
        2. Imposta la nuova password se il token è valido
        
        Args:
            request: Contiene uid, token e nuova password
            
        Returns:
            Response: Messaggio di successo o errore appropriato
        """
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