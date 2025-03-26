# backend/apps/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    """
    Custom manager per il modello User personalizzato.
    Gestisce la creazione e la gestione degli utenti con autenticazione via email anziché username.
    """
    def create_user(self, email, password=None, **extra_fields):
        """
        Crea e salva un utente con l'email e la password fornite.
        
        Args:
            email: L'indirizzo email univoco dell'utente
            password: Password dell'utente (opzionale)
            **extra_fields: Campi aggiuntivi da assegnare all'utente
            
        Returns:
            User: Un'istanza dell'utente creato
            
        Raises:
            ValueError: Se l'email non viene fornita
        """
        if not email:
            raise ValueError('L\'indirizzo email è obbligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crea e salva un superuser con l'email e la password fornite.
        I superuser hanno tutti i permessi di amministrazione.
        
        Args:
            email: L'indirizzo email univoco del superuser
            password: Password del superuser
            **extra_fields: Campi aggiuntivi da assegnare al superuser
            
        Returns:
            User: Un'istanza del superuser creato
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    """
    Modello User personalizzato che utilizza l'email come identificatore univoco
    anziché l'username. Include campi aggiuntivi specifici per HR come job_title e department.
    
    Questo modello estende AbstractUser di Django aggiungendo attributi rilevanti
    per la gestione delle risorse umane e modificando i campi relativi ai gruppi per
    evitare conflitti di related_name.
    """
    email = models.EmailField(unique=True)
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    
    # Aggiungi related_name per risolvere i conflitti
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='account_users',  # Invece di user_set
        blank=True,
        help_text='I gruppi a cui appartiene questo utente. Un utente otterrà tutte le autorizzazioni concesse a ciascuno dei suoi gruppi.',
        verbose_name='gruppi',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='account_users',  # Invece di user_set
        blank=True,
        help_text='Autorizzazioni specifiche per questo utente.',
        verbose_name='autorizzazioni utente',
    )
    
    USERNAME_FIELD = 'email'  # Imposta l'email come campo di autenticazione principale
    REQUIRED_FIELDS = ['first_name', 'last_name']  # Campi aggiuntivi richiesti durante creazione
    
    objects = UserManager()  # Collega il manager personalizzato
    
    def __str__(self):
        """
        Restituisce una rappresentazione leggibile dell'utente.
        
        Returns:
            str: Nome, cognome ed email dell'utente
        """
        return f"{self.first_name} {self.last_name} <{self.email}>"