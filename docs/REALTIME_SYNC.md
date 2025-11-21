# Sistema de Sincronização em Tempo Real

## Visão Geral

O sistema de leilão agora possui atualização em tempo real totalmente funcional, garantindo que todos os participantes vejam as mudanças instantaneamente quando alguém faz ou remove lances.

## Arquitetura

### 1. Hook Global: `useSyncManager`

**Localização:** [src/hooks/useSyncManager.ts](../src/hooks/useSyncManager.ts)

Gerenciador centralizado de sincronização que coordena todas as atualizações em tempo real.

**Funcionalidades:**
- ✅ Sistema de pub/sub para eventos de sincronização
- ✅ Debounce automático (100ms) para evitar múltiplas atualizações
- ✅ Invalidação coordenada de caches SWR
- ✅ Rastreamento de timestamps de sincronização

**Eventos suportados:**
- `bid_placed` - Quando um lance é colocado
- `bid_retracted` - Quando um lance é removido
- `room_updated` - Atualizações gerais da sala

### 2. Store Principal: `useAuctionStore`

**Localização:** [src/hooks/useAuctionStore.ts](../src/hooks/useAuctionStore.ts)

**Melhorias:**
- ✅ Polling automático a cada 2 segundos
- ✅ Inscrição em eventos globais de sincronização
- ✅ Indicador de atualização em tempo real (`isRealtimeUpdate`)
- ✅ Revalidação otimizada com `dedupingInterval`

### 3. Tabela de Mercado: `MarketTable`

**Localização:** [src/components/auction/MarketTable.tsx](../src/components/auction/MarketTable.tsx)

**Melhorias:**
- ✅ Polling automático a cada 3 segundos
- ✅ Inscrição em eventos globais de sincronização
- ✅ Indicador visual "Sincronizando..." quando há atualizações
- ✅ Revalidação automática ao focar na aba

### 4. Cliente da Sala: `AuctionRoomClient`

**Localização:** [src/components/auction/AuctionRoomClient.tsx](../src/components/auction/AuctionRoomClient.tsx)

**Melhorias:**
- ✅ Dispara eventos de sincronização após ações
- ✅ Propagação global de atualizações
- ✅ Feedback visual no header durante sincronização

### 5. Header do Leilão: `AuctionHeader`

**Localização:** [src/components/auction/AuctionHeader.tsx](../src/components/auction/AuctionHeader.tsx)

**Melhorias:**
- ✅ Indicador visual "Sync" com ícone animado
- ✅ Aparece durante atualizações em tempo real
- ✅ Design responsivo (oculta texto em telas pequenas)

## Fluxo de Atualização

### Quando um lance é feito:

```
1. Usuário clica em "DAR LANCE"
2. Modal de lance é preenchido
3. `handlePlaceBid()` é chamado
4. Server Action `placeBid()` executa
5. `triggerSync('bid_placed')` dispara evento global
6. Todos os componentes inscritos recebem notificação:
   - useAuctionStore revalida (/api/room/:id/sync)
   - MarketTable revalida (/api/room/:id/items)
7. Indicadores visuais aparecem brevemente
8. Interface atualiza para todos os usuários
```

### Polling de Segurança:

Mesmo sem eventos explícitos, o sistema atualiza automaticamente:
- **useAuctionStore**: 2 segundos
- **MarketTable**: 3 segundos

Isso garante sincronização mesmo se houver perda de eventos.

## Indicadores Visuais

### 1. Header - Indicador "Sync"
- Aparece no canto superior esquerdo
- Ícone de refresh animado
- Cor verde (`emerald-400`)
- Duração: 1 segundo

### 2. MarketTable - Badge "Sincronizando..."
- Aparece no topo da tabela
- Ícone de refresh girando
- Texto "Sincronizando..."
- Duração: 1 segundo

## Configurações de Performance

### Intervals de Polling:
```typescript
useAuctionStore: {
  refreshInterval: 2000,      // 2s - dados críticos
  dedupingInterval: 1000,     // 1s - evita requests duplicados
}

MarketTable: {
  refreshInterval: 3000,      // 3s - menos crítico
  dedupingInterval: 1000,     // 1s - evita requests duplicados
}
```

### Debounce:
```typescript
syncManager: {
  debounce: 100ms             // Previne múltiplas sincronizações
}
```

## Benefícios

✅ **Atualização Instantânea**: Mudanças aparecem imediatamente para todos os usuários
✅ **Feedback Visual**: Indicadores mostram quando há sincronização
✅ **Performance Otimizada**: Debounce e deduplicação evitam requests excessivos
✅ **Confiabilidade**: Polling de backup garante sincronização mesmo se eventos falharem
✅ **Escalabilidade**: Arquitetura preparada para WebSockets/SSE no futuro

## Próximos Passos (Opcional)

### Fase 2: Server-Sent Events (SSE)

Para escalar para centenas de usuários simultâneos:

1. Criar endpoint `/api/room/:id/events` com SSE
2. Substituir polling por subscriptions de eventos
3. Reduzir carga no servidor significativamente
4. Latência ainda menor (< 100ms)

### Fase 3: WebSockets

Para funcionalidades bidirecionais avançadas:

1. Chat em tempo real entre participantes
2. Notificações push instantâneas
3. Presença online de usuários
4. Cursores colaborativos

## Monitoramento

Para debug, você pode verificar os timestamps de sincronização:

```typescript
const { getLastSync } = useSyncManager(roomId);
console.log('Última sincronização:', new Date(getLastSync()));
```

## Suporte

- O sistema é compatível com todos os navegadores modernos
- Funciona offline (polling retoma automaticamente ao reconectar)
- Sem dependências externas além do SWR já existente
