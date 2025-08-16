import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Crear un nuevo carrito temporal (puedes llamarlo cuando el usuario inicia la compra)
export const createCart = async (req, res) => { 
  try {
    const newCart = new Cart({
      orderNumber: 0, // temporal, se asigna al finalizar la compra
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      products: [],
      total: 0
    });
    await newCart.save();
    res.status(201).json({ cartId: newCart._id });
  } catch (error) {
    console.error('Error al crear el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Agregar producto (con talla y color) al carrito
export const addToCart = async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity = 1, size, color } = req.body;

    const product = await Product.findById(pid);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado.' });
    }

    // Busca el producto en el carrito con el mismo talle y color
    const productInCart = cart.products.find(
      (p) => p.product.equals(pid) && p.size === size && p.color === color
    );

    if (productInCart) {
      productInCart.quantity += parseInt(quantity);
      productInCart.subtotal = productInCart.quantity * product.price;
    } else {
      cart.products.push({
        product: pid,
        name: product.title,
        quantity: parseInt(quantity),
        price: product.price,
        size,
        color,
        subtotal: parseInt(quantity) * product.price
      });
    }

    // Actualiza el total del carrito temporal
    cart.total = cart.products.reduce((acc, p) => acc + p.subtotal, 0);

    await cart.save();

    res.status(200).json({ message: 'Producto agregado al carrito correctamente.', cart });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener el carrito con productos poblados
export const getCartById = async (req, res) => {
  try {
    const { cid } = req.params;
    const cart = await Cart.findById(cid).populate('products.product');
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado.' });
    }
    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar producto del carrito
export const deleteProductFromCart = async (req, res) => {
  const { cid, pid } = req.params;
  const { size, color } = req.body; // se necesita talla y color para identificar el producto exacto

  try {
    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    cart.products = cart.products.filter(
      (item) => !(item.product.toString() === pid && item.size === size && item.color === color)
    );
    cart.total = cart.products.reduce((acc, p) => acc + p.subtotal, 0);

    await cart.save();

    res.status(200).json({ message: 'Producto eliminado del carrito', cart });
  } catch (error) {
    console.error('Error al eliminar producto del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar cantidad de un producto (talla y color)
export const updateProductQuantity = async (req, res) => {
  const { cid, pid } = req.params;
  const { quantity, size, color } = req.body;

  try {
    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const productIndex = cart.products.findIndex(
      (item) => item.product.toString() === pid && item.size === size && item.color === color
    );
    if (productIndex === -1) return res.status(404).json({ error: 'Producto no encontrado en el carrito' });

    cart.products[productIndex].quantity = quantity;
    cart.products[productIndex].subtotal = quantity * cart.products[productIndex].price;
    cart.total = cart.products.reduce((acc, p) => acc + p.subtotal, 0);

    await cart.save();

    res.status(200).json({ message: 'Cantidad de producto actualizada', cart });
  } catch (error) {
    console.error('Error al actualizar cantidad del producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Vaciar el carrito completo
export const emptyCart = async (req, res) => {
  const { cid } = req.params;

  try {
    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    cart.products = [];
    cart.total = 0;
    await cart.save();

    res.status(200).json({ message: 'Carrito vaciado correctamente', cart });
  } catch (error) {
    console.error('Error al vaciar el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Finalizar la compra (checkout)
export const finalizarCompra = async (req, res) => {
  try {
    // Buscar el último número de pedido
    const ultimoCarrito = await Cart.findOne({ orderNumber: { $gt: 0 } }).sort({ orderNumber: -1 });
    const orderNumber = ultimoCarrito ? ultimoCarrito.orderNumber + 1 : 1;

    const { cid } = req.params;
    const cart = await Cart.findById(cid).populate('products.product');
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado.' });

    const { name, email, phone, address } = req.body;

    // Solo finaliza si hay productos
    if (cart.products.length === 0) return res.status(400).json({ error: 'No hay productos en el carrito.' });

    // Asigna los datos del cliente y el número de pedido
    cart.orderNumber = orderNumber;
    cart.customerName = name;
    cart.customerEmail = email;
    cart.customerPhone = phone;
    cart.customerAddress = address;
    cart.total = cart.products.reduce((acc, p) => acc + p.subtotal, 0);

    await cart.save();

    res.status(201).json({ ok: true, orderNumber, pedido: cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};