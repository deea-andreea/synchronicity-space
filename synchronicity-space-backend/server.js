import app from "./src/app.js";
 
const PORT = process.env.PORT || 3000;
 
app.listen(PORT, () => {
  console.log(`S-Space API running at http://localhost:${PORT}`);
  console.log(`Docs: http://localhost:${PORT}/notes`);
});