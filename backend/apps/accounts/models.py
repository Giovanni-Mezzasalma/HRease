# backend/apps/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('L\'indirizzo email è obbligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
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
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"