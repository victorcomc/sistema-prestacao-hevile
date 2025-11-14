from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Importe as novas funções
from .views import (
    ViagemViewSet, AdiantamentoViewSet, DespesaViewSet, UserViewSet,
    aprovar_despesa, rejeitar_despesa,
    DepartamentoViewSet,
    DespesasParaAprovacaoView # <<< 1. IMPORTAR A NOVA VIEW
)

# 1. Roteador Automático
router = DefaultRouter()
router.register(r'viagens', ViagemViewSet, basename='viagem')
router.register(r'adiantamentos', AdiantamentoViewSet, basename='adiantamento')
router.register(r'users', UserViewSet, basename='user')
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')


# 2. Rotas Manuais para Despesas (Básicas)
despesa_list = DespesaViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
despesa_detail = DespesaViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

# 3. Lista Final de URLs
urlpatterns = [
    # Rotas do roteador
    path('', include(router.urls)), 
    
    # Rotas básicas de despesa
    path('despesas/', despesa_list, name='despesa-list'),
    path('despesas/<int:pk>/', despesa_detail, name='despesa-detail'),
    
    # Rotas de Ação (apontando para as novas funções)
    path('despesas/<int:pk>/aprovar/', aprovar_despesa, name='despesa-aprovar'),
    path('despesas/<int:pk>/rejeitar/', rejeitar_despesa, name='despesa-rejeitar'),
    
    # --- INÍCIO DA MUDANÇA ---
    # 2. ADICIONAR A NOVA ROTA
    path('despesas-para-aprovacao/', DespesasParaAprovacaoView.as_view(), name='despesa-para-aprovacao'),
    # --- FIM DA MUDANÇA ---
]