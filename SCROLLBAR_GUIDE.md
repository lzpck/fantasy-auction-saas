# 📜 Guia de Scrollbar Customizada

## 🎨 Visão Geral

A aplicação Fantasy Auction SaaS possui scrollbars totalmente customizadas que seguem o design system existente, com suporte automático para modo claro e escuro.

## 🎯 Características

- ✅ **Design System Integrado**: Usa as cores do Tailwind CSS (slate, sky)
- ✅ **Dark/Light Mode**: Adaptação automática baseada em `prefers-color-scheme`
- ✅ **Cross-Browser**: Suporte para Webkit (Chrome, Safari, Edge) e Firefox
- ✅ **Feedback Visual**: Estados hover e active com transições suaves
- ✅ **Acessibilidade**: Indicadores de foco visíveis e dimensões adequadas
- ✅ **Touch Optimized**: Scrollbars maiores para dispositivos de toque
- ✅ **Variantes Flexíveis**: Classes utilitárias para diferentes casos de uso

## 🎨 Cores Utilizadas

### Modo Claro
- **Track**: `#f8fafc` (slate-50)
- **Thumb**: `#cbd5e1` (slate-300)
- **Thumb Hover**: `#94a3b8` (slate-400)
- **Thumb Active**: `#64748b` (slate-500)
- **Border**: `#e2e8f0` (slate-200)

### Modo Escuro
- **Track**: `#0f172a` (slate-950)
- **Thumb**: `#334155` (slate-700)
- **Thumb Hover**: `#475569` (slate-600)
- **Thumb Active**: `#0ea5e9` (sky-500) - cor de destaque
- **Border**: `#1e293b` (slate-800)

## 📐 Dimensões

| Tipo | Desktop | Touch Device |
|------|---------|--------------|
| Padrão | 12px × 12px | 14px × 14px |
| Horizontal | 12px × 10px | 14px × 10px |
| Thin | 6px × 6px | 6px × 6px |
| Overlay | 8px × 8px | 8px × 8px |

## 🔧 Como Usar

### Scrollbar Padrão (Global)

Por padrão, **todas** as áreas roláveis da aplicação já possuem a scrollbar customizada. Não é necessário adicionar nenhuma classe.

```tsx
// Funciona automaticamente
<div className="overflow-y-auto h-96">
  {/* Conteúdo longo aqui */}
</div>
```

### Variante: Scrollbar Overlay

Ideal para modais, dropdowns e elementos flutuantes. A scrollbar fica transparente e menor.

```tsx
<div className="scrollbar-overlay overflow-y-auto h-96">
  {/* Conteúdo de modal */}
</div>
```

**Uso recomendado:**
- Modais e dialogs
- Dropdowns e select menus
- Sidebars flutuantes
- Tooltips grandes

### Variante: Scrollbar Thin

Uma versão mais discreta para espaços apertados.

```tsx
<div className="scrollbar-thin overflow-x-auto">
  {/* Tabela larga */}
</div>
```

**Uso recomendado:**
- Tabelas com scroll horizontal
- Código embarcado
- Listas compactas
- Áreas de navegação lateral

### Variante: Scrollbar Hidden

Oculta a scrollbar mas mantém a funcionalidade de scroll.

```tsx
<div className="scrollbar-none overflow-y-auto">
  {/* Conteúdo com scroll invisível */}
</div>
```

**Uso recomendado:**
- Carrosséis de imagens
- Galerias horizontais
- Scroll infinito
- Experiências imersivas

## 🎭 Estados Interativos

### Hover
Quando o usuário passa o mouse sobre a scrollbar, ela se torna mais proeminente:
- **Light mode**: Muda de `slate-300` para `slate-400`
- **Dark mode**: Muda de `slate-700` para `slate-600`

### Active (Dragging)
Quando o usuário está arrastando a scrollbar:
- **Light mode**: Muda para `slate-500`
- **Dark mode**: Muda para `sky-500` (azul vibrante - mesma cor de destaque da aplicação)

### Transições
Todas as mudanças de cor têm uma transição suave de `0.2s ease` para melhor experiência do usuário.

## 🖥️ Compatibilidade de Navegadores

| Navegador | Suporte | Observações |
|-----------|---------|-------------|
| Chrome 90+ | ✅ Full | Webkit scrollbar |
| Safari 14+ | ✅ Full | Webkit scrollbar |
| Edge 90+ | ✅ Full | Webkit scrollbar |
| Firefox 64+ | ✅ Full | `scrollbar-width` e `scrollbar-color` |
| Opera 76+ | ✅ Full | Webkit scrollbar |
| Mobile Safari | ✅ Full | Auto-hide nativo mantido |
| Chrome Android | ✅ Full | Dimensões maiores em touch |

## 📱 Dispositivos de Toque

Em dispositivos touch (`@media (hover: none) and (pointer: coarse)`):

- Scrollbars são **14px** ao invés de 12px (mais fácil de tocar)
- Thumb é mais proeminente por padrão (melhor visibilidade)
- Border é maior (3px ao invés de 2px)

## ♿ Acessibilidade

### Foco de Teclado
Elementos focados via teclado exibem um outline de 2px na cor ativa da scrollbar:

```css
*:focus-visible {
  outline: 2px solid var(--scrollbar-thumb-active);
  outline-offset: 2px;
}
```

### Contraste
Todas as cores foram escolhidas para atender aos padrões WCAG:
- Contraste mínimo de 3:1 entre thumb e track
- Feedback visual claro em todos os estados

### Navegação por Teclado
A scrollbar customizada não interfere com:
- Scroll via `Arrow Keys`, `Page Up/Down`, `Home/End`
- Tab navigation
- Screen readers

## 🔨 Customização Avançada

### Modificar Cores

Edite as variáveis CSS em [globals.css](src/app/globals.css):

```css
:root {
  --scrollbar-track: #sua-cor-track;
  --scrollbar-thumb: #sua-cor-thumb;
  --scrollbar-thumb-hover: #sua-cor-hover;
  --scrollbar-thumb-active: #sua-cor-active;
  --scrollbar-border: #sua-cor-border;
}
```

### Criar Variante Personalizada

Adicione sua própria classe no [globals.css](src/app/globals.css):

```css
.scrollbar-custom::-webkit-scrollbar {
  width: 20px; /* Tamanho customizado */
}

.scrollbar-custom::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #0ea5e9, #10b981);
  border-radius: 10px;
}
```

Use no componente:

```tsx
<div className="scrollbar-custom overflow-auto">
  {/* Conteúdo */}
</div>
```

## 📋 Exemplos Práticos

### Tabela de Leilão com Scroll

```tsx
<div className="scrollbar-thin overflow-x-auto border border-slate-800 rounded-xl">
  <table className="w-full">
    {/* Tabela larga */}
  </table>
</div>
```

### Modal de Importação de Jogadores

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
  <div className="bg-slate-900 rounded-2xl max-h-[80vh] scrollbar-overlay overflow-y-auto">
    {/* Conteúdo do modal */}
  </div>
</div>
```

### Lista de Times com Scroll Infinito

```tsx
<div className="scrollbar-none overflow-y-auto h-screen">
  {teams.map(team => (
    <TeamCard key={team.id} {...team} />
  ))}
</div>
```

### Dashboard Admin com Sidebar

```tsx
<aside className="w-64 h-screen overflow-y-auto border-r border-slate-800">
  <nav className="p-4">
    {/* Links de navegação */}
  </nav>
</aside>
```

## 🚀 Performance

A scrollbar customizada é otimizada para performance:

- **GPU Accelerated**: Transições usam `transform` e `opacity` quando possível
- **CSS-only**: Sem JavaScript, zero overhead
- **Lazy styles**: Apenas elementos com overflow recebem os estilos
- **No layout shift**: Dimensões fixas previnem refluxo

## 🐛 Troubleshooting

### Scrollbar não aparece

**Problema**: O elemento não mostra a scrollbar.

**Solução**: Certifique-se de que:
```tsx
// ✅ Correto
<div className="overflow-y-auto h-96">

// ❌ Errado - falta overflow
<div className="h-96">

// ❌ Errado - falta altura definida
<div className="overflow-y-auto">
```

### Scrollbar muito clara em dark mode

**Problema**: Scrollbar pouco visível em modo escuro.

**Solução**: Ajuste a cor do thumb no [globals.css](src/app/globals.css):
```css
@media (prefers-color-scheme: dark) {
  :root {
    --scrollbar-thumb: #475569; /* Mais claro */
  }
}
```

### Conflito com classes Tailwind

**Problema**: Classes do Tailwind sobrescrevem a scrollbar.

**Solução**: As classes customizadas (`scrollbar-*`) têm maior especificidade e devem funcionar. Se houver conflito, use `!important` ou ajuste a ordem no CSS.

## 📚 Referências

- [MDN: CSS Scrollbars](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scrollbars)
- [Webkit Scrollbar Pseudo-elements](https://webkit.org/blog/363/styling-scrollbars/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📝 Changelog

### v1.0.0 (Atual)
- ✨ Implementação inicial com suporte dark/light mode
- ✨ Variantes: overlay, thin, none
- ✨ Otimização para touch devices
- ✨ Estados hover e active com transições
- ♿ Melhorias de acessibilidade

---

**Desenvolvido com** ❤️ **para Fantasy Auction SaaS**
