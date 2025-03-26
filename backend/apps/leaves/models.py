# backend/apps/leaves/models.py
from django.db import models
from django.conf import settings

class LeaveType(models.Model):
    """
    Rappresenta i diversi tipi di assenza disponibili nel sistema.
    Ad esempio: ferie, malattia, permessi, ecc.
    
    Ogni tipo di assenza ha un nome, una descrizione, un indicatore
    per specificare se è retribuito e un codice colore per la UI.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_paid = models.BooleanField(default=True)
    color_code = models.CharField(max_length=7, default='#3498db')  # Colore per la UI
    
    def __str__(self):
        """
        Restituisce una rappresentazione leggibile del tipo di assenza.
        
        Returns:
            str: Nome del tipo di assenza
        """
        return self.name

class LeaveRequest(models.Model):
    """
    Rappresenta una richiesta di assenza da parte di un dipendente.
    
    Registra chi richiede l'assenza, il tipo di assenza, il periodo,
    lo stato della richiesta e le informazioni di audit. Mantiene anche
    il riferimento a chi ha approvato la richiesta, se applicabile.
    """
    STATUS_CHOICES = [
        ('pending', 'In attesa'),
        ('approved', 'Approvato'),
        ('rejected', 'Rifiutato'),
        ('cancelled', 'Annullato'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='leave_requests'
    )
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    half_day = models.BooleanField(default=False)  # Per gestire richieste di mezze giornate
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
        """
        Restituisce una rappresentazione leggibile della richiesta di assenza.
        
        Returns:
            str: Utente, tipo di assenza e periodo
        """
        return f"{self.user} - {self.leave_type} ({self.start_date} to {self.end_date})"
    
    @property
    def duration(self):
        """
        Calcola la durata dell'assenza in giorni, inclusi il giorno di inizio e fine.
        
        Returns:
            int: Numero di giorni di assenza
            
        Note:
            Non tiene conto dei giorni festivi o dei weekend. Per calcoli più precisi
            sarebbe necessario implementare una logica aggiuntiva che consideri
            le festività e i giorni lavorativi.
        """
        delta = self.end_date - self.start_date
        return delta.days + 1

class Holiday(models.Model):
    """
    Rappresenta giorni festivi o di chiusura aziendale.
    
    Registra le festività nazionali, locali o aziendali con possibilità di
    specificare se la festività ricorre annualmente.
    """
    name = models.CharField(max_length=100)
    date = models.DateField()
    description = models.TextField(blank=True)
    is_recurring = models.BooleanField(default=True)  # Se ricorre ogni anno
    
    def __str__(self):
        """
        Restituisce una rappresentazione leggibile della festività.
        
        Returns:
            str: Nome e data della festività
        """
        return f"{self.name} ({self.date})"