# Chatbase quote actions

## `enviar_a_ventas`

Usar una accion de tipo `Call API`.

### Endpoint

```text
POST https://ozexoekvshuhtkrleuze.supabase.co/functions/v1/submit-quote-request
```

### Headers

```text
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY_O_TOKEN_PUBLICO_DEL_EDGE_FUNCTION>
```

Si el function queda publico, basta con `Content-Type`.

### Data inputs sugeridos

- `contact_name`
- `email`
- `phone`
- `notes`
- `items`
- `total_mxn`

### Body sugerido

```json
{
  "contact_name": "{{contact_name}}",
  "email": "{{email}}",
  "phone": "{{phone}}",
  "notes": "{{notes}}",
  "items": {{items}},
  "total_mxn": {{total_mxn}},
  "source": "chatbase-bonny",
  "page_path": "/chatbase/bonny"
}
```

### Respuesta esperada

```json
{
  "ok": true,
  "saved": true,
  "sales_notified": true,
  "resumen": "Solicitud preparada para el equipo comercial.",
  "lineas": [
    {
      "nombre": "MB-210 MB. ROJO PELICULA",
      "cantidad_kg": 200,
      "subtotal_mxn_formateado": "26,200"
    }
  ],
  "total_mxn_formateado": "26,200",
  "mensaje_ventas": "Solicitud de cotizacion generada desde Bonny...",
  "mensaje_whatsapp": "Hola AGAMA, soy Samu...",
  "url_whatsapp": "https://wa.me/525573515156?text=...",
  "next_step": "La solicitud ya quedo enviada a ventas.",
  "widget_mode": "sales_request"
}
```

## Widget recomendado

Si luego quieres mostrar resultado bonito, usa `Call API + show widget` y renderiza:

- `resumen`
- `lineas`
- `total_mxn_formateado`
- `next_step`
- boton o link con `url_whatsapp`

Mientras no conectes el response real, no adjuntes ejemplos fijos a la accion.
