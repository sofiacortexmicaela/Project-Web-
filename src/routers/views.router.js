import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js'; 

const router = express.Router();


//------------------RUTAS PARA PRODUCTOS-------------------------------//

// Ruta para agregar productos a ese carrito 
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find();

        // toma el cartId de la sesión (puede ser null si todavía no se creó)
        const cartId = req.session.cartId;

        res.render('products', {
            products,
            title: ' Sofit | Tienda deportiva ',
            cartId
        });
    } catch (error) {
        res.status(500).send('Error al cargar los productos');
    }
});


// Ruta para mostrar detalle de un producto
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).render('error', { message: 'Producto no encontrado' });
        }

        const cartId = req.session.cartId; // ← para que lo use el form

        res.render('productDetail', {
            title: `Detalle de ${product.title}`,
            product,
            cartId,
            helpers: {
                json: (context) => JSON.stringify(context)
            }
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).render('error', { message: 'Error del servidor' });
    }
});

//------------------------CREAR CARRITO DESDE LA WEB--------------//
router.post("/add-to-cart/:pid", async (req, res) => {
     const { pid } = req.params; // 👈 Esto estaba faltando
    console.log("Datos recibidos del form:", req.body); // 👈 Esto nos dirá si size y color están llegando

    const { size, color, quantity } = req.body;

    if (!size || !color) {
        return res.status(400).send("Talle y color no especificado");
    }

    // Si no existe carrito en sesión, crear uno
    if (!req.session.cartId) {
        const newCart = await Cart.create({ products: [] });
        req.session.cartId = newCart._id;
    }

    const cart = await Cart.findById(req.session.cartId);

    const existingItem = cart.products.find(
        item => item.product.toString() === pid && item.size === size && item.color === color
    );

    if (existingItem) {
        existingItem.quantity += Number(quantity);
    } else {
        cart.products.push({
            product: pid,
            size,
            color,
            quantity: Number(quantity)
        });
    }

    await cart.save();
    res.redirect(`/carts/${req.session.cartId}`);
});

//-----------------
router.get('/carts/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate('products.product');

        if (!cart) return res.status(404).send('Carrito no encontrado');

        // Calculamos total
        let total = 0;

        // Aseguramos que cada producto tenga talle y color (ajustá según cómo lo guardes en tu carrito)
        const productsWithDetails = cart.products.map(item => {
            total += item.quantity * item.product.price;
            return {
                product: item.product,
                quantity: item.quantity,
                size: item.size || 'No especificado',
                color: item.color || 'No especificado'
            };
        });

        res.render('cartView', {
            title: 'Tu carrito',
            cart: { products: productsWithDetails },
            total
        });
    } catch (error) {
        console.error('Error al mostrar el carrito:', error);
        res.status(500).send('Error del servidor');
    }
});

router.get('/datosDeCompra', (req, res) => {
    const cartId = req.session.cartId;

    if (!cartId) {
        return res.redirect('/products');
    }

    res.render('checkout', {
        title: 'Finalizar compra',
        cartId
    });
});

//-------------Ruta para que cuando el cliete toque boton finalizar compra, se------------------//
//-------------------cierre el carrito y lo rediriga a /products--------------------------//
router.post("/procesarCompra", async (req, res) => {
    const { cartId, nombre, email, direccion, telefono, codPostal, localidad, calle, numero } = req.body;

    // Generar número de pedido SIN OrderCounter
    const ultimoCarrito = await Cart.findOne({ orderNumber: { $gt: 0 } }).sort({ orderNumber: -1 });
    const numeroPedido = ultimoCarrito ? ultimoCarrito.orderNumber + 1 : 1;

    const cart = await Cart.findById(cartId).populate("products.product");

    if (!cart) {
        console.log("⛔ Carrito no encontrado.");
        return res.status(404).send("Carrito no encontrado");
    }

    // Añade los datos al carrito y guarda como pedido finalizado
    cart.orderNumber = numeroPedido;
    cart.customerName = nombre;
    cart.customerEmail = email;
    cart.customerPhone = telefono;
    cart.customerAddress = `${calle} ${numero}, ${localidad}, CP: ${codPostal}`;

    // Actualiza los productos y calcula total
    let total = 0;
    const productos = cart.products.map((p) => {
        const subtotal = p.quantity * p.product.price;
        total += subtotal;
        return {
            nombre: p.product.title,
            cantidad: p.quantity,
            precio: p.product.price,
            size: p.size,
            color: p.color,
            subtotal
        };
    });

    cart.total = total;
    await cart.save();

    // Mostrar solo la info de la compra en la consola
    console.log(`🛒 Compra realizada por ${nombre} <${email}>`);
    console.log(`📍 Dirección completa: ${calle} ${numero}, ${localidad}, CP: ${codPostal}`);
    console.log(`📞 Teléfono: ${telefono}`);
    console.log(`🧾 Número de pedido: #${numeroPedido}`);
    console.log("🧾 Productos comprados:");
    productos.forEach((p, i) => {
        console.log(
            `  #${i + 1} - ${p.nombre} | Talle: ${p.size} | Color: ${p.color} | Cantidad: ${p.cantidad} | Precio unitario: $${p.precio} | Subtotal: $${p.subtotal}`
        );
    });
    console.log(`💰 Total de la compra: $${total}`);

    req.session.cartId = null;

    res.render("finalCompra", {
        title: "Compra Finalizada",
        nombre,
        numeroPedido,
        productos,
        total
    });
});


router.get('/cartView', async (req, res) => {
  const cartId = req.session.cartId;
  if (!cartId) {
    return res.redirect('/products'); // o catálogo
  }
  res.redirect(`/carts/${cartId}`);
});



router.get('/finalCompra', (req, res) => {
  res.render('finalCompra'); // nombre de la vista .handlebars
});

router.get('/', (req, res) => {
  res.redirect('/products');
});



router.get('/nosotros', (req, res) => {
  res.render('nosotros', { title: 'Nosotros' });
});

router.get('/informacion', (req, res) => {
  res.render('informacion', { title: 'Informacion' });
});


router.get('/catalogo', async (req, res) => {
  try {
    const products = await Product.find(); // o con paginación
    res.render('catalogo', { products });
  } catch (error) {
    res.status(500).send('Error al cargar el catálogo');
  }
});

export default router;