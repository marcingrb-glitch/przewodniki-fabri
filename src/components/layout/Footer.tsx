const Footer = () => {
  return (
    <footer className="border-t bg-card py-4 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        © {new Date().getFullYear()} System Przewodników Produkcyjnych
      </div>
    </footer>
  );
};

export default Footer;
