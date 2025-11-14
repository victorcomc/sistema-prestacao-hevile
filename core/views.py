from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status, generics
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import Coalesce
from decimal import Decimal
from .models import Departamento, Viagem, Adiantamento, Despesa
from .serializers import (
    ViagemSerializer, AdiantamentoSerializer, DespesaSerializer, UserSerializer, 
    UserCreateSerializer, DepartamentoSerializer
)
from datetime import date

class DepartamentoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

class ViagemViewSet(viewsets.ModelViewSet):
    queryset = Viagem.objects.all()
    serializer_class = ViagemSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        
        # --- INÍCIO DA MUDANÇA ---
        # Bloco "if status_filtro == 'preparando':" REMOVIDO.
        # --- FIM DA MUDANÇA ---
        
        if user.is_superuser:
            return Viagem.objects.all().order_by('-data_inicio') # Admin vê tudo

        perfil = getattr(user, 'perfil', None)
        if not perfil:
            return Viagem.objects.filter(participantes=user).order_by('-data_inicio')
        
        user_tipo = perfil.tipo

        if self.action == 'list':
            filtro = self.request.query_params.get('filtro', 'pendentes')

            if user_tipo == 'DIRETOR':
                subordinados = User.objects.filter(perfil__tipo='GESTOR')
                despesas_qs = Despesa.objects.filter(usuario__in=subordinados)

            elif user_tipo == 'GESTOR':
                deptos_gerenciados = user.departamentos_gerenciados.all()
                subordinados = User.objects.filter(
                    perfil__tipo='COLABORADOR',
                    perfil__departamentos__in=deptos_gerenciados
                ).distinct()
                despesas_qs = Despesa.objects.filter(usuario__in=subordinados)
            
            else:
                return Viagem.objects.filter(participantes=user).order_by('-data_inicio')

            if filtro == 'pendentes':
                despesas_qs = despesas_qs.filter(status='PENDENTE')

            viagem_ids = despesas_qs.values_list('viagem_id', flat=True).distinct()
            return Viagem.objects.filter(id__in=viagem_ids).order_by('-data_inicio')
        else:
            if user_tipo in ['GESTOR', 'DIRETOR']:
                return Viagem.objects.all()
            
            return Viagem.objects.filter(participantes=user)


class AdiantamentoViewSet(viewsets.ModelViewSet):
    queryset = Adiantamento.objects.all().order_by('-data_adiantamento')
    serializer_class = AdiantamentoSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_superuser:
            if getattr(user, 'perfil', None) and user.perfil.tipo == 'COLABORADOR':
                queryset = queryset.filter(usuario=user)

        viagem_id = self.request.query_params.get('viagem', None)
        if viagem_id is not None:
            queryset = queryset.filter(viagem_id=viagem_id)
        return queryset

class DespesaViewSet(viewsets.ModelViewSet):
    queryset = Despesa.objects.all()
    serializer_class = DespesaSerializer

    def get_pagination_class(self):
        return None

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        viagem_id = self.request.query_params.get('viagem', None)

        user_tipo = getattr(user, 'perfil', None)
        if user_tipo:
            user_tipo = user_tipo.tipo

        if viagem_id is None:
            return queryset.filter(usuario=user)
        
        if user.is_superuser:
            return queryset.filter(viagem_id=viagem_id)

        if user_tipo == 'DIRETOR':
            return queryset.filter(
                viagem_id=viagem_id,
                usuario__perfil__tipo='GESTOR'
            ).distinct()

        if user_tipo == 'GESTOR':
            meus_deptos_gerenciados = user.departamentos_gerenciados.all()
            
            subordinados = User.objects.filter(
                perfil__tipo='COLABORADOR',
                perfil__departamentos__in=meus_deptos_gerenciados
            ).distinct()
            
            return queryset.filter(
                viagem_id=viagem_id
            ).filter(
                Q(usuario__in=subordinados)
            ).distinct()

        return queryset.filter(viagem_id=viagem_id, usuario=user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    def perform_update(self, serializer):
        serializer.save(status='PENDENTE')

class UserViewSet(viewsets.ModelViewSet): 
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer 

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        data = serializer.data
        user = request.user
        today = date.today()

        total_adiantamentos = Adiantamento.objects.filter(usuario=user).aggregate(
            soma=Coalesce(Sum('valor'), Decimal('0.00'))
        )['soma']
        total_despesas = Despesa.objects.filter(usuario=user).aggregate(
            soma=Coalesce(Sum('valor'), Decimal('0.00'))
        )['soma']
        data['saldo'] = total_adiantamentos - total_despesas
        
        viagem_info = None
        viagem_ativa = Viagem.objects.filter(participantes=user, data_inicio__lte=today, data_fim__gte=today).first()
        if viagem_ativa:
            viagem_info = {"id": viagem_ativa.id, "titulo": viagem_ativa.titulo, "status": "ATIVA"}
        
        if not viagem_info:
            viagem_pendente = Viagem.objects.filter(participantes=user, data_inicio__gt=today).order_by('data_inicio').first()
            if viagem_pendente:
                viagem_info = {"id": viagem_pendente.id, "titulo": viagem_pendente.titulo, "status": "AGUARDANDO"}
        
        if not viagem_info:
            viagem_finalizada = Viagem.objects.filter(participantes=user, data_fim__lt=today).order_by('-data_fim').first()
            if viagem_finalizada:
                viagem_info = {"id": viagem_finalizada.id, "titulo": viagem_finalizada.titulo, "status": "FINALIZADA"}

        data['viagem_atual'] = viagem_info
        return Response(data)

class DespesasParaAprovacaoView(generics.ListAPIView):
    serializer_class = DespesaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        perfil = getattr(user, 'perfil', None)

        if not perfil:
            return Despesa.objects.none() 

        if perfil.tipo == 'DIRETOR':
            return Despesa.objects.filter(
                status='PENDENTE',
                usuario__perfil__tipo='GESTOR'
            )
        
        elif perfil.tipo == 'GESTOR':
            deptos_gerenciados = user.departamentos_gerenciados.all()
            
            subordinados = User.objects.filter(
                perfil__tipo='COLABORADOR',
                perfil__departamentos__in=deptos_gerenciados
            ).distinct()
            
            return Despesa.objects.filter(
                status='PENDENTE',
                usuario__in=subordinados
            )

        return Despesa.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def aprovar_despesa(request, pk):
    try:
        despesa = Despesa.objects.get(pk=pk, status='PENDENTE')
    except Despesa.DoesNotExist:
        return Response({'error': 'Despesa não encontrada ou já processada.'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    perfil = getattr(user, 'perfil', None)
    
    if despesa.usuario == user:
        return Response({'error': 'Você não pode aprovar suas próprias despesas.'}, status=status.HTTP_403_FORBIDDEN)

    if user.is_superuser:
        pass 
    
    elif not perfil:
        return Response({'error': 'Usuário sem perfil de aprovação.'}, status=status.HTTP_403_FORBIDDEN)

    elif perfil.tipo == 'DIRETOR':
        if getattr(despesa.usuario, 'perfil', None) and despesa.usuario.perfil.tipo == 'GESTOR':
            pass 
        else:
            return Response({'error': 'Diretores só podem aprovar despesas de Gestores.'}, status=status.HTTP_403_FORBIDDEN)
    
    elif perfil.tipo == 'GESTOR':
        if getattr(despesa.usuario, 'perfil', None) and despesa.usuario.perfil.tipo == 'COLABORADOR':
            deptos_gerenciados = user.departamentos_gerenciados.all()
            subordinados_ids = User.objects.filter(
                perfil__tipo='COLABORADOR', 
                perfil__departamentos__in=deptos_gerenciados
            ).values_list('id', flat=True)

            if despesa.usuario.id in subordinados_ids:
                pass 
            else:
                return Response({'error': 'Gestor só pode aprovar despesas de colaboradores do seu departamento.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Gestores só podem aprovar despesas de Colaboradores.'}, status=status.HTTP_403_FORBIDDEN)
            
    else:
        return Response({'error': 'Você não tem permissão para aprovar despesas.'}, status=status.HTTP_403_FORBIDDEN)

    despesa.status = 'APROVADO'
    despesa.aprovador = user
    despesa.data_aprovacao = timezone.now()
    despesa.save()
    return Response({'status': 'despesa aprovada'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def rejeitar_despesa(request, pk):
    try:
        despesa = Despesa.objects.get(pk=pk, status='PENDENTE')
    except Despesa.DoesNotExist:
        return Response({'error': 'Despesa não encontrada ou já processada.'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    perfil = getattr(user, 'perfil', None)
    
    if despesa.usuario == user:
        return Response({'error': 'Você não pode rejeitar suas próprias despesas.'}, status=status.HTTP_403_FORBIDDEN)

    if user.is_superuser:
        pass 
    
    elif not perfil:
        return Response({'error': 'Usuário sem perfil de aprovação.'}, status=status.HTTP_403_FORBIDDEN)

    elif perfil.tipo == 'DIRETOR':
        if getattr(despesa.usuario, 'perfil', None) and despesa.usuario.perfil.tipo == 'GESTOR':
            pass 
        else:
            return Response({'error': 'Diretores só podem rejeitar despesas de Gestores.'}, status=status.HTTP_403_FORBIDDEN)
    
    elif perfil.tipo == 'GESTOR':
        if getattr(despesa.usuario, 'perfil', None) and despesa.usuario.perfil.tipo == 'COLABORADOR':
            deptos_gerenciados = user.departamentos_gerenciados.all()
            subordinados_ids = User.objects.filter(
                perfil__tipo='COLABORADOR', 
                perfil__departamentos__in=deptos_gerenciados
            ).values_list('id', flat=True)

            if despesa.usuario.id in subordinados_ids:
                pass 
            else:
                return Response({'error': 'Gestor só pode aprovar despesas de colaboradores do seu departamento.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Gestores só podem aprovar despesas de Colaboradores.'}, status=status.HTTP_403_FORBIDDEN)
            
    else:
        return Response({'error': 'Você não tem permissão para aprovar despesas.'}, status=status.HTTP_403_FORBIDDEN)

    observacao = request.data.get('observacao_rejeicao', None)
    if not observacao:
        return Response({'error': 'A observação é obrigatória para rejeitar.'}, status=status.HTTP_400_BAD_REQUEST)

    despesa.status = 'REJEITADO'
    despesa.aprovador = user
    despesa.data_aprovacao = timezone.now()
    despesa.observacao_rejeicao = observacao
    despesa.save()
    return Response({'status': 'despesa rejeitada'}, status=status.HTTP_200_OK)