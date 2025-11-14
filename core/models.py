from django.db import models
from django.contrib.auth.models import User

class Departamento(models.Model):
    nome = models.CharField(max_length=100)
    gestor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="departamentos_gerenciados")

    def __str__(self):
        return self.nome

class PerfilUsuario(models.Model):
    TIPOS_USUARIO = (
        ('DIRETOR', 'Diretor'),
        ('GESTOR', 'Gestor'),
        ('COLABORADOR', 'Colaborador'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    tipo = models.CharField(max_length=20, choices=TIPOS_USUARIO, default='COLABORADOR')
    departamentos = models.ManyToManyField(Departamento, blank=True, related_name="perfis") 
    foto_perfil = models.ImageField(upload_to='fotos_perfil/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.tipo}"

class Viagem(models.Model):
    STATUS_VIAGEM = (
        ('ATIVA', 'Ativa'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    )
    titulo = models.CharField(max_length=200)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_VIAGEM, default='ATIVA')
    participantes = models.ManyToManyField(User, related_name='viagens')

    def __str__(self):
        return f"{self.titulo} ({self.status})"

class Adiantamento(models.Model):
    viagem = models.ForeignKey(Viagem, on_delete=models.CASCADE, related_name='adiantamentos')
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='adiantamentos_recebidos')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_adiantamento = models.DateField(auto_now_add=True)
    observacoes = models.TextField(blank=True, null=True)
    comprovante_deposito = models.FileField(upload_to='comprovantes_adiantamentos/%Y/%m/', blank=True, null=True)

    def __str__(self):
        if self.viagem:
            return f"R$ {self.valor} para {self.usuario.username} na viagem {self.viagem.titulo}"
        return f"R$ {self.valor} para {self.usuario.username}"


class Despesa(models.Model):
    STATUS_DESPESA = (
        ('PENDENTE', 'Pendente'),
        ('APROVADO', 'Aprovado'),
        ('REJEITADO', 'Rejeitado'),
    )
    CATEGORIAS = (
        ('ALIMENTACAO', 'Alimentação'),
        ('TRANSPORTE', 'Transporte'),
        ('HOSPEDAGEM', 'Hospedagem'),
        ('OUTROS', 'Outros'),
    )
    viagem = models.ForeignKey(Viagem, on_delete=models.CASCADE, related_name='despesas')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='despesas_realizadas')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_despesa = models.DateField()
    descricao = models.CharField(max_length=255)
    categoria = models.CharField(max_length=50, choices=CATEGORIAS, default='OUTROS')
    
    # --- INÍCIO DA MUDANÇA ---
    # Removido 'blank=True, null=True' para tornar o comprovante obrigatório
    comprovante = models.FileField(upload_to='comprovantes/%Y/%m/')
    # --- FIM DA MUDANÇA ---
    
    status = models.CharField(max_length=20, choices=STATUS_DESPESA, default='PENDENTE')
    aprovador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='despesas_aprovadas')
    data_aprovacao = models.DateTimeField(null=True, blank=True)
    observacao_rejeicao = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"R$ {self.valor} - {self.descricao} ({self.status})"