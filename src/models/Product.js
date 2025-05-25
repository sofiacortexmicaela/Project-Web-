import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2'; // Importa el plugin de paginación

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  code: String,
  price: Number,
  category: String,
  available: Boolean,
  thumbnails: [String],
  talles: [String],
  colores: [String],
  stock: [{
    talle: String,
    color: String,
    cantidad: Number,
    disponibilidad: String // "Disponible para entrega inmediata", etc.
  }]
}, { timestamps: true });

// Agrega el plugin de paginación al esquema
productSchema.plugin(mongoosePaginate);

const Product = mongoose.model('Product', productSchema);

export default Product;