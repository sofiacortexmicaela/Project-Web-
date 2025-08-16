import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    orderNumber: { type: Number, required: false }, // No requerido al crear carrito temporal
    customerName: { type: String, required: false },
    customerEmail: { type: String, required: false },
    customerPhone: { type: String, required: false },
    customerAddress: { type: String, required: false },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String },       // Título del producto, no requerido al principio
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number },      // No requerido al principio
            size: { type: String },       // No requerido al principio
            color: { type: String },      // No requerido al principio
            subtotal: { type: Number }
        },
    ],
    total: { type: Number, default: 0 }, // El carrito puede estar vacío al principio
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;