# Cart API Usage Guide

## Update Cart Item Quantity

### Endpoint
```
PUT /cart/update/{cartItemId}
```

### Request Body
```json
{
  "quantity": 3
}
```

### Special Cases

#### 1. Update Quantity
```json
{
  "quantity": 5
}
```
- Updates the cart item quantity to 5
- Validates stock availability
- Returns updated cart item info

#### 2. Remove Item (Set quantity to 0)
```json
{
  "quantity": 0
}
```
- Automatically removes the item from cart
- Same as calling DELETE /cart/remove/{cartItemId}

### Response Examples

#### Success Response
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "cartItemId": "123e4567-e89b-12d3-a456-426614174000",
    "newQuantity": 3,
    "previousQuantity": 2,
    "availableStock": 50
  }
}
```

#### Error Responses

**Insufficient Stock:**
```json
{
  "success": false,
  "message": "Insufficient stock available. Only 2 items available.",
  "error": "BAD_REQUEST"
}
```

**Product Unavailable:**
```json
{
  "success": false,
  "message": "Product is no longer available",
  "error": "BAD_REQUEST"
}
```

**Cart Item Not Found:**
```json
{
  "success": false,
  "message": "Cart item not found",
  "error": "NOT_FOUND"
}
```

### Validation Rules
- Quantity must be between 0 and 999
- Quantity 0 = remove item
- Quantity < 1 = error (unless 0)
- Stock validation applies
- Product availability checked
