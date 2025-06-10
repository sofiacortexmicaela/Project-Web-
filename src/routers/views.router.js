import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js'; 
import OrderCounter from '../models/OrderCounter.js'; 

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

        res.render('productDetail', {
        title: `Detalle de ${product.title}`,
        product,
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
router.post('/add-to-cart/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const objectProductId = new mongoose.Types.ObjectId(productId);

        let cartId = req.body.cartId || req.session.cartId;
        console.log('Cart ID recibido:', cartId);

        let cart;

        // crear nuevo carrito si no existe
        if (!cartId) {
            const newCart = new Cart({ products: [] });
            cart = await newCart.save();
            cartId = cart._id.toString();
            req.session.cartId = cartId;
            console.log(' Carrito nuevo creado <3 ', cartId);
        } else {
            cart = await Cart.findById(cartId);
            if (!cart) {
                const newCart = new Cart({ products: [] });
                cart = await newCart.save();
                cartId = cart._id.toString();
                req.session.cartId = cartId;
                console.log(' Carrito no encontrado, se creó uno nuevo:', cartId);
            } else {
                console.log(' Carrito existente encontrado:', cartId);
            }
        }

        // verifica si el producto ya está
        const existingProductIndex = cart.products.findIndex(p => p.product.toString() === productId);

        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += 1;
        } else {
            cart.products.push({ product: objectProductId, quantity: 1 });
        }

        await cart.save();

        console.log(' Producto agregado correctamente al carrito  <3 ', productId);
        console.log(' Estado actual del carrito:', cart.products);

        res.redirect(`/carts/${cartId}`);
    } catch (error) {
        console.error(' xxx Error al agregar producto al carrito:', error);
        res.status(500).send('Error al agregar producto al carrito');
    }
});
//-----------------
router.get('/carts/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate('products.product');

        if (!cart) return res.status(404).send('Carrito no encontrado');

        res.render('cartView', {
            title: 'Tu carrito',
            cart
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

    // Generar número de pedido
    let orderCounter = await OrderCounter.findOne();
    if (!orderCounter) {
        orderCounter = new OrderCounter({ count: 1 });
    } else {
        orderCounter.count += 1;
    }
    await orderCounter.save();
    const numeroPedido = orderCounter.count;

    console.log(`🛒 Compra realizada por ${nombre} <${email}>`);
    console.log(`📍 Dirección completa: ${calle} ${numero}, ${localidad}, CP: ${codPostal}`);
    console.log(`📞 Teléfono: ${telefono}`);
    console.log(`🧾 Número de pedido: #${numeroPedido}`);

    const cart = await Cart.findById(cartId).populate("products.product");

    if (!cart) {
        console.log("⛔ Carrito no encontrado.");
        return res.status(404).send("Carrito no encontrado");
    }

    const productos = cart.products.map(p => ({
        nombre: p.product.title,
        cantidad: p.quantity,
        precio: p.product.price
    }));

    console.log("🧾 Productos comprados:");
    productos.forEach((p, i) => {
        console.log(`  #${i + 1} - ${p.nombre} | Cantidad: ${p.cantidad} | Precio: $${p.precio}`);
    });

    req.session.cartId = null;

    res.render("finalCompra", {
        title: "Compra Finalizada",
        nombre,
        numeroPedido
    });
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