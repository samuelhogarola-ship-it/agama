# AGAMA Configurador

Repo aislado para el configurador visual de colores AGAMA, separado del resto de superficies del proyecto.

## Comandos

```bash
npm install
npm run dev
```

La app queda disponible en `/configurador`.

## Notas de arquitectura futura

- Este repo debe poder integrar a posteriori una API conectada con el CRM de AGAMA.
- Esa integración futura debe permitir consultar disponibilidad por tienda o sucursal para cada producto relevante.
- El carrito y el configurador deben quedar preparados para enriquecer cada configuración con datos de stock y disponibilidad comercial sin rehacer la UI actual.
- También debe ser posible conectar una pasarela de pago compartida con la tienda principal de AGAMA.
- La pasarela de pago no se implementa en esta fase, pero la decisión de arquitectura es reutilizar la misma integración de checkout y cobro tanto en la tienda normal como en este configurador.
