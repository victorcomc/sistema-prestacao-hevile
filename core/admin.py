from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Departamento, PerfilUsuario, Viagem, Adiantamento, Despesa

# Define um inline para o PerfilUsuario aparecer dentro da tela de criação de Usuário padrão
class PerfilUsuarioInline(admin.StackedInline):
    model = PerfilUsuario
    can_delete = False
    verbose_name_plural = 'Perfil do Usuário'

# Define um novo UserAdmin
class UserAdmin(BaseUserAdmin):
    inlines = (PerfilUsuarioInline,)

# Re-registra o UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Registra os nossos outros modelos
@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'gestor')

@admin.register(Viagem)
class ViagemAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'status', 'data_inicio', 'data_fim')
    list_filter = ('status',)
    search_fields = ('titulo',)

@admin.register(Adiantamento)
class AdiantamentoAdmin(admin.ModelAdmin):
    list_display = ('viagem', 'usuario', 'valor', 'data_adiantamento')
    list_filter = ('viagem',)

@admin.register(Despesa)
class DespesaAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'valor', 'usuario', 'viagem', 'status', 'categoria')
    list_filter = ('status', 'viagem', 'usuario', 'categoria')
    search_fields = ('descricao',)