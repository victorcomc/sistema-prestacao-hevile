from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Departamento, PerfilUsuario, Viagem, Adiantamento, Despesa
from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import Coalesce
from decimal import Decimal


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__'

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    departamentos = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Departamento.objects.all(),
        required=False 
    ) 
    
    class Meta:
        model = PerfilUsuario
        fields = ['tipo', 'departamentos', 'foto_perfil']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['departamentos'] = DepartamentoSerializer(instance.departamentos.all(), many=True).data
        return representation


class UserSerializer(serializers.ModelSerializer):
    perfil = PerfilUsuarioSerializer()
    saldo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'perfil', 'saldo']

    def get_saldo(self, obj):
        total_adiantamentos = Adiantamento.objects.filter(usuario=obj).aggregate(
            soma=Coalesce(Sum('valor'), Decimal('0.00'))
        )['soma']
        total_despesas = Despesa.objects.filter(usuario=obj).aggregate(
            soma=Coalesce(Sum('valor'), Decimal('0.00'))
        )['soma']
        return total_adiantamentos - total_despesas

    def update(self, instance, validated_data):
        perfil_data = validated_data.pop('perfil', None)
        
        if 'username' in validated_data:
            validated_data['email'] = validated_data['username']
        
        instance = super().update(instance, validated_data)

        if perfil_data:
            perfil = instance.perfil
            perfil.tipo = perfil_data.get('tipo', perfil.tipo)
            departamentos_data = perfil_data.get('departamentos', None)

            Departamento.objects.filter(gestor=instance).update(gestor=None)
            
            if departamentos_data is not None:
                perfil.departamentos.set(departamentos_data)
                
                if perfil.tipo == 'GESTOR':
                    depto_ids = [depto.id for depto in departamentos_data]
                    Departamento.objects.filter(id__in=depto_ids).update(gestor=instance)
            
            perfil.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    tipo = serializers.ChoiceField(
        choices=PerfilUsuario.TIPOS_USUARIO, 
        write_only=True,
    )
    departamentos = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Departamento.objects.all(),
        required=False, 
        write_only=True 
    )
    foto_perfil = serializers.ImageField(required=False, write_only=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = [
            'username', 'password', 'first_name', 'last_name', 
            'tipo', 'departamentos', 'foto_perfil'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        tipo_data = validated_data.pop('tipo')
        departamentos_data = validated_data.pop('departamentos', [])
        foto_data = validated_data.pop('foto_perfil', None)
        
        validated_data['email'] = validated_data['username']
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        perfil = PerfilUsuario.objects.create(
            user=user, 
            tipo=tipo_data,
            foto_perfil=foto_data
        )
        
        if departamentos_data:
            perfil.departamentos.set(departamentos_data)
            
            if tipo_data == 'GESTOR':
                for depto in departamentos_data:
                    depto.gestor = user
                    depto.save()
        return user

class ViagemSerializer(serializers.ModelSerializer):
    participantes_detalhes = UserSerializer(source='participantes', many=True, read_only=True)
    participantes = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), write_only=True
    )
    status_dinamico = serializers.SerializerMethodField()

    class Meta:
        model = Viagem
        fields = [
            'id', 
            'titulo', 
            'data_inicio', 
            'data_fim', 
            'status',
            'status_dinamico',
            'participantes', 
            'participantes_detalhes'
            ]
            
    def get_status_dinamico(self, obj):
        hoje = timezone.now().date()
        
        if obj.status == 'CANCELADA':
            return 'Cancelada'
        
        if hoje < obj.data_inicio:
            return 'Preparando'
        elif obj.data_inicio <= hoje <= obj.data_fim:
            return 'Ativa'
        else: # hoje > obj.data_fim
            return 'Finalizada'

class AdiantamentoSerializer(serializers.ModelSerializer):
    usuario_detalhes = UserSerializer(source='usuario', read_only=True)
    viagem_titulo = serializers.CharField(source='viagem.titulo', read_only=True)

    class Meta:
        model = Adiantamento
        fields = [
            'id', 
            'viagem',
            'viagem_titulo',
            'usuario',
            'usuario_detalhes',
            'valor', 
            'data_adiantamento', 
            'observacoes', 
            'comprovante_deposito'
        ]
        read_only_fields = ['data_adiantamento', 'usuario_detalhes', 'viagem_titulo']

class DespesaSerializer(serializers.ModelSerializer):
    usuario_detalhes = UserSerializer(source='usuario', read_only=True)

    class Meta:
        model = Despesa
        fields = ['id', 'viagem', 'usuario', 'usuario_detalhes', 'valor', 'data_despesa', 'descricao', 'categoria', 'comprovante', 'status', 'aprovador']
        read_only_fields = ['usuario', 'status', 'aprovador', 'data_aprovacao']