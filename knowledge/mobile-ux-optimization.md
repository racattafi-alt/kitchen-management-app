# Mobile UX Optimization Best Practices

## Principi Generali
- **Mobile-first**: progettare prima per mobile, poi espandere per desktop
- **No overflow**: nessun testo o pulsante deve uscire dai container
- **Touch-friendly**: target minimi 44x44px per elementi interattivi
- **Breakpoints**: mobile (default) → tablet (md:) → desktop (lg:)

## Layout Responsive

### Grid Responsive
```tsx
// ✅ Buono: grid responsive con fallback mobile
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Cattivo: grid fisso che causa overflow
<div className="grid grid-cols-3 gap-4">
```

### Flex Responsive
```tsx
// ✅ Buono: flex-col su mobile, flex-row su desktop
<div className="flex flex-col md:flex-row gap-4">

// ❌ Cattivo: flex-row fisso
<div className="flex flex-row gap-4">
```

## Testo e Contenuti

### Truncate per Testi Lunghi
```tsx
// ✅ Buono: truncate su mobile, normale su desktop
<h3 className="text-lg font-semibold truncate md:text-clip">

// ✅ Buono: line-clamp per paragrafi
<p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">
```

### Dimensioni Testo Responsive
```tsx
// ✅ Buono: testo più piccolo su mobile
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
<p className="text-sm md:text-base">
```

## Pulsanti e Azioni

### Pulsanti Icon-Only su Mobile
```tsx
// ✅ Buono: solo icona su mobile, con testo su desktop
<Button size="sm" variant="outline">
  <Edit className="h-4 w-4" />
  <span className="hidden md:inline ml-2">Modifica</span>
</Button>

// ❌ Cattivo: testo sempre visibile (overflow su mobile)
<Button size="sm" variant="outline">
  <Edit className="h-4 w-4 mr-2" />
  Modifica Ricetta
</Button>
```

### Gruppi Pulsanti Responsive
```tsx
// ✅ Buono: stack verticale su mobile, orizzontale su desktop
<div className="flex flex-col sm:flex-row gap-2">
  <Button className="w-full sm:w-auto">Azione 1</Button>
  <Button className="w-full sm:w-auto">Azione 2</Button>
</div>
```

## Card e Container

### Card Responsive
```tsx
// ✅ Buono: padding ridotto su mobile
<Card className="p-4 md:p-6">
  <CardHeader className="pb-2 md:pb-4">
    <CardTitle className="text-base md:text-lg">
```

### Container Max-Width
```tsx
// ✅ Buono: container con max-width per desktop
<div className="max-w-screen-xl mx-auto px-4 md:px-6">
```

## Form e Input

### Form Layout Responsive
```tsx
// ✅ Buono: form stack verticale su mobile
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label>Campo 1</Label>
    <Input />
  </div>
  <div>
    <Label>Campo 2</Label>
    <Input />
  </div>
</div>
```

### Input Full-Width su Mobile
```tsx
// ✅ Buono: input full-width su mobile
<Input className="w-full" />
```

## Dialog e Modal

### Dialog Responsive
```tsx
// ✅ Buono: dialog full-screen su mobile, dimensione fissa su desktop
<DialogContent className="max-w-full md:max-w-2xl h-screen md:h-auto">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

## Tabelle

### Tabelle Scrollabili
```tsx
// ✅ Buono: tabella scrollabile orizzontalmente su mobile
<div className="overflow-x-auto">
  <Table>
    {/* ... */}
  </Table>
</div>
```

### Tabelle Responsive con Hidden Columns
```tsx
// ✅ Buono: nascondi colonne non essenziali su mobile
<TableHead className="hidden md:table-cell">Dettagli</TableHead>
<TableCell className="hidden md:table-cell">{details}</TableCell>
```

## Header e Navigation

### Header Responsive
```tsx
// ✅ Buono: header con search full-width su mobile
<div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold">Titolo</h1>
  </div>
  <div className="w-full md:w-auto">
    <Input placeholder="Cerca..." className="w-full" />
  </div>
</div>
```

## Sticky Footer Mobile

### Footer con Totali
```tsx
// ✅ Buono: sticky footer solo su mobile
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg z-50">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm">Totale</div>
      <div className="text-2xl font-bold">€ 123.45</div>
    </div>
    <Button size="sm">Azione</Button>
  </div>
</div>

// Aggiungi padding-bottom al container per evitare overlap
<div className="pb-24 md:pb-6">
```

## Checklist Ottimizzazione Mobile

- [ ] Grid responsive (grid-cols-1 sm:grid-cols-2)
- [ ] Testo con truncate/line-clamp
- [ ] Pulsanti icon-only su mobile
- [ ] Form stack verticale su mobile
- [ ] Dialog full-screen su mobile
- [ ] Tabelle scrollabili
- [ ] Header con search full-width
- [ ] Padding ridotto su mobile
- [ ] Sticky footer con padding-bottom
- [ ] Test su viewport 375px, 768px, 1024px
