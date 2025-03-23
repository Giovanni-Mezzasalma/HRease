# backend/apps/leaves/models.py
from django.db import models
from django.conf import settings

class LeaveType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_paid = models.BooleanField(default=True)
    color_code = models.CharField(max_length=7, default='#3498db')  # Colore per la UI
    
    def __str__(self):
        return self.name

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'In attesa'),
        ('approved', 'Approvato'),
        ('rejected', 'Rifiutato'),
        ('cancelled', 'Annullato'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    half_day = models.BooleanField(default=False)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Metadati e audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_leaves'
    )
    approval_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user} - {self.leave_type} ({self.start_date} to {self.end_date})"
    
    @property
    def duration(self):
        """Calcola la durata in giorni"""
        delta = self.end_date - self.start_date
        return delta.days + 1

class Holiday(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateField()
    description = models.TextField(blank=True)
    is_recurring = models.BooleanField(default=True)  # Se ricorre ogni anno
    
    def __str__(self):
        return f"{self.name} ({self.date})"