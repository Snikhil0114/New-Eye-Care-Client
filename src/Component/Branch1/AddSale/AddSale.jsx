import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AddSale.css";

const createNewSaleItem = () => ({
  productId: "",
  productDetails: { price: "0", stock: "0" },
  salePrice: "0",
  quantity: "0",
  itemTotal: 0,
});

const AddSale = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleItems, setSaleItems] = useState([createNewSaleItem()]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(0);
  const [currentSaleId, setCurrentSaleId] = useState(null); // To store the saleId after saving
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Fetch customers
    axios
      .get("https://new-eye-care-server.onrender.com/shala/customers")
      .then((response) => {
        setCustomers(response.data);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });

    // Fetch products
    axios
      .get("https://new-eye-care-server.onrender.com/shala/products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  }, []);

  useEffect(() => {
    calculateTotals(saleItems);
  }, [orderDiscount, saleItems]);

  const handleCustomerChange = async (event) => {
    const id = event.target.value;
    setCustomerId(id);
    try {
      const response = await axios.get(
        `https://new-eye-care-server.onrender.com/shala/customers/${id}`
      );
      const { phone } = response.data;
      setCustomerPhone(phone);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setCustomerPhone(""); // Clear phone number if error occurs
    }
  };

  const handleProductChange = async (index, event) => {
    const id = event.target.value;
    const newSaleItems = [...saleItems];
    newSaleItems[index].productId = id;
    try {
      const response = await axios.get(
        `https://new-eye-care-server.onrender.com/shala/products/${id}`
      );
      const { price, stock } = response.data;
      if (stock === 0) {
        alert("Stock is not available. Select another product.");
        newSaleItems[index] = createNewSaleItem();
      } else {
        newSaleItems[index].productDetails = { price, stock };
        newSaleItems[index].salePrice = "0";
        newSaleItems[index].quantity = "0";
        newSaleItems[index].itemTotal = 0;
      }
      setSaleItems(newSaleItems);
      calculateTotals(newSaleItems);
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  const handleSaleItemChange = (index, field, value) => {
    const newSaleItems = [...saleItems];

    if (field === "quantity") {
      const quantity = parseFloat(value) || 0;
      const stock = parseFloat(newSaleItems[index].productDetails.stock) || 0;

      if (quantity > stock) {
        alert("Quantity exceeds available stock. Please adjust.");
        return; // Prevent further updates if the quantity exceeds stock
      }
    }

    newSaleItems[index][field] = value;
    calculateItemTotal(index, newSaleItems);
    setSaleItems(newSaleItems);
  };

  const calculateItemTotal = (index, saleItems) => {
    const price = parseFloat(saleItems[index].salePrice) || 0;
    const quantity = parseFloat(saleItems[index].quantity) || 0;
    saleItems[index].itemTotal = price * quantity;
    calculateTotals(saleItems);
  };

  const calculateTotals = (saleItems) => {
    const total = saleItems.reduce((sum, item) => sum + item.itemTotal, 0);
    const totalAfterDiscount = total - orderDiscount;
    setOrderTotal(total);
    setTotalAfterDiscount(totalAfterDiscount);
  };

  const handleAddProduct = () => {
    setSaleItems([...saleItems, createNewSaleItem()]);
  };

  const handleRemoveProduct = (index) => {
    const newSaleItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(newSaleItems);
    calculateTotals(newSaleItems);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const saleData = saleItems.map((item) => ({
      product_id: item.productId,
      sale_price: item.salePrice,
      quantity: item.quantity,
    }));

    const apiEndpoint = currentSaleId
      ? `https://new-eye-care-server.onrender.com/shala/sales/${currentSaleId}`
      : "https://new-eye-care-server.onrender.com/shala/sales";
    const method = currentSaleId ? "PUT" : "POST";

    axios({
      method,
      url: apiEndpoint,
      data: {
        customer_id: customerId,
        customer_phone: customerPhone,
        sale_data: saleData,
        payment_method: paymentMethod,
        order_discount: orderDiscount,
        paid,
      },
    })
      .then((response) => {
        setSuccessMessage("Sale saved successfully!");
        if (!currentSaleId) {
          // Store the new saleId from response
          setCurrentSaleId(response.data.sale_id);
        }
      })
      .catch((error) => {
        console.error("Error submitting sale:", error);
        setSuccessMessage("Error saving sale.");
      });
  };

  const handlePrintBill = () => {
    if (!currentSaleId) {
      alert("No sale ID available. Please save the sale first.");
      return;
    }

    // Handle the print functionality here
    alert(`Print functionality for sale ID: ${currentSaleId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="add-sale-form">
      <h2>Sale Order</h2>
      <div className="customer-info">
        <div className="input-group-row">
          <div className="input-group">
            <label>Customer:</label>
            <select value={customerId} onChange={handleCustomerChange} required>
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Customer Phone Number:</label>
            <input type="text" value={customerPhone} readOnly />
          </div>
        </div>
      </div>

      <table className="sale-items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Product MRP</th>
            <th>Sale Price</th>
            <th>Quantity</th>
            <th>Stock</th>
            <th>Item Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {saleItems.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <select
                  value={item.productId}
                  onChange={(e) => handleProductChange(index, e)}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="MRP">{item.productDetails.price}</td>
              <td>
                <input
                  type="number"
                  value={item.salePrice}
                  onChange={(e) =>
                    handleSaleItemChange(index, "salePrice", e.target.value)
                  }
                  required
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleSaleItemChange(index, "quantity", e.target.value)
                  }
                  required
                />
              </td>
              <td className="MRP">{item.productDetails.stock}</td>
              <td className="MRP">{item.itemTotal.toFixed(2)}</td>
              <td>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(index)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="add-product">
        <button type="button" onClick={handleAddProduct}>
          Add Product
        </button>
      </div>
      <div className="totals">
        <div className="input-group">
          <label>Order Total:</label>
          <input type="number" value={orderTotal.toFixed(2)} readOnly />
        </div>
        <div className="input-group">
          <label>Order Discount:</label>
          <input
            type="number"
            value={orderDiscount}
            onChange={(e) => setOrderDiscount(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Total After Discount:</label>
          <input type="number" value={totalAfterDiscount.toFixed(2)} readOnly />
        </div>
        <div className="input-group">
          <label>Paid Amount:</label>
          <input
            type="number"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            min="0"
          />
        </div>
      </div>
      <div className="input-group">
        <label>Payment Method:</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Online">Online</option>
        </select>
      </div>
      <button type="submit">Save Sale</button>
      <button type="button" onClick={handlePrintBill}>
        Print Bill
      </button>
      {successMessage && <p>{successMessage}</p>}
    </form>
  );
};

export default AddSale;
