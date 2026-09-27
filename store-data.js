import { getStoreSession } from "./supabase-client.js";

const cartSubscribers = new Map();
const orderSubscribers = new Map();

function addSubscriber(subscribers, userId, callback) {
  if (!subscribers.has(userId)) subscribers.set(userId, new Set());
  subscribers.get(userId).add(callback);
  return () => {
    const callbacks = subscribers.get(userId);
    callbacks?.delete(callback);
    if (callbacks?.size === 0) subscribers.delete(userId);
  };
}

function notify(subscribers, userId) {
  subscribers.get(userId)?.forEach((callback) => callback());
}

function mapProduct(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    brand: row.brand,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    image: row.image,
    imageAlt: row.image_alt,
    shade: row.shade,
    tags: row.tags || [],
  };
}

function mapOrder(row) {
  return {
    id: row.id,
    items: row.items,
    subtotal: Number(row.subtotal),
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function loadCatalog() {
  const { supabase } = await getStoreSession();
  const [categoryResult, productResult] = await Promise.all([
    supabase.from("categories").select("id,name,sort_order").order("sort_order"),
    supabase.from("products").select("*").eq("active", true).order("name"),
  ]);
  if (categoryResult.error) throw categoryResult.error;
  if (productResult.error) throw productResult.error;
  return {
    categories: categoryResult.data.map((row) => ({ id: row.id, name: row.name, sortOrder: row.sort_order })),
    products: productResult.data.map(mapProduct),
  };
}

async function readCart(userId) {
  const { supabase } = await getStoreSession();
  const { data, error } = await supabase
    .from("carts")
    .select("product_id,quantity,products!carts_product_id_fkey(id,category_id,name,price,image)")
    .eq("user_id", userId)
    .order("updated_at");
  if (error) throw error;
  return data.map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      id: row.product_id,
      productId: row.product_id,
      categoryId: product.category_id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      quantity: row.quantity,
    };
  });
}

async function readOrders(userId) {
  const { supabase } = await getStoreSession();
  const { data, error } = await supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapOrder);
}

export async function watchCart(userId, onChange, onError) {
  const refresh = () => readCart(userId).then(onChange).catch(onError);
  const unsubscribe = addSubscriber(cartSubscribers, userId, refresh);
  await refresh();
  return unsubscribe;
}

export async function addCartItem(userId, product) {
  const { supabase } = await getStoreSession();
  const { error } = await supabase.rpc("add_cart_item", { p_product_id: product.id });
  if (error) throw error;
  notify(cartSubscribers, userId);
}

export async function removeCartItem(userId, productId) {
  const { supabase } = await getStoreSession();
  const { error } = await supabase.from("carts").delete().eq("user_id", userId).eq("product_id", productId);
  if (error) throw error;
  notify(cartSubscribers, userId);
}

export async function placeOrder(userId) {
  const { supabase } = await getStoreSession();
  const { data, error } = await supabase.rpc("place_order");
  if (error) throw error;
  notify(cartSubscribers, userId);
  notify(orderSubscribers, userId);
  return mapOrder(data);
}

export async function watchOrders(userId, onChange, onError) {
  const refresh = () => readOrders(userId).then(onChange).catch(onError);
  const unsubscribe = addSubscriber(orderSubscribers, userId, refresh);
  await refresh();
  return unsubscribe;
}

export async function loadLatestMatch(userId) {
  const { supabase } = await getStoreSession();
  const { data, error } = await supabase.from("visitor_journal").select("latest_match,match_answers,matched_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data?.latest_match ? { ...data.latest_match, answers: data.match_answers, matchedAt: data.matched_at } : null;
}

export async function saveLatestMatch(userId, product, answers) {
  const { supabase } = await getStoreSession();
  const latestMatch = { ...product, productId: product.id };
  const { error } = await supabase.from("visitor_journal").upsert({
    user_id: userId,
    latest_match: latestMatch,
    match_answers: answers,
    matched_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
