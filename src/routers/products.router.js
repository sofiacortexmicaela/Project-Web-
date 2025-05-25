import express from 'express';
import Product from '../models/Product.js'; // Asegúrate de importar el modelo

const router = express.Router();  

// Obtener productos con paginación, filtros y ordenamiento
router.get('/', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;

        let filter = {};
        if (query) {
            filter = { category: query }; // Filtra por categoría
        }

        const options = {
            limit: parseInt(limit),
            page: parseInt(page),
            sort: sort === 'asc' ? { price: 1 } : sort === 'desc' ? { price: -1 } : undefined,
        };

        const products = await Product.paginate(filter, options); // Usando mongoose-paginate-v2
        res.json({
            status: "success",
            payload: products.docs,
            totalPages: products.totalPages,
            prevPage: products.hasPrevPage ? page - 1 : null,
            nextPage: products.hasNextPage ? page + 1 : null,
            page: products.page,
            hasPrevPage: products.hasPrevPage,
            hasNextPage: products.hasNextPage,
            prevLink: products.hasPrevPage ? `/api/products?limit=${limit}&page=${page - 1}&sort=${sort}&query=${query}` : null,
            nextLink: products.hasNextPage ? `/api/products?limit=${limit}&page=${page + 1}&sort=${sort}&query=${query}` : null,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


//Ruta para agregar productos en la base de datos de MongoDB Atlas directo del POSTMAN
router.post('/', async (req, res) => {
    try {
        const { title, description, code, price, stock, category, available, thumbnails } = req.body;

        // Valida que los campos requeridos estén presentes
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
        }

        // Crea un nuevo producto
        const newProduct = new Product({
            title,
            description,
            code,
            price,
            stock,
            category,
            available: available ?? true, // Valor predeterminado: true
            thumbnails: thumbnails || [], // Valor predeterminado: array vacío
        });

        // Guarda el producto en la base de datos
        const savedProduct = await newProduct.save();

        res.status(201).json({ status: 'success', product: savedProduct });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Ruta para eliminar un producto por su ID directo del POSTMAN
router.delete('/:pid', async (req, res) => {
    try {
        const pid = parseInt(req.params.pid, 10);
        await productManager.deleteProduct(pid);ñ
        res.status(204).send(); // Sin contenido
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(404).json({ error: error.message });
    }
});




router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) {
      return res.status(404).send('Producto no encontrado');
    }

    res.status(200).json({
      message: 'Producto actualizado correctamente',
      producto: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).send('Error del servidor');
  }
});


export default router;

