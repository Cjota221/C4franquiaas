// NOVA FUNÇÃO handleCustomUpload SIMPLIFICADA - USA API ENDPOINT

const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "desktop" | "mobile") => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validar tipo de arquivo
  if (!file.type.startsWith("image/")) {
    alert("Por favor, selecione uma imagem válida.");
    return;
  }

  // Validar tamanho (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("A imagem deve ter no máximo 5MB.");
    return;
  }

  setUploading(true);
  try {
    console.log("📤 Enviando banner via API:", { type, fileName: file.name, size: file.size });
    
    // Criar FormData para enviar o arquivo
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type === 'desktop' ? 'header' : 'footer');

    // Fazer requisição para a API
    const response = await fetch('/api/revendedora/banners/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Erro na API:", result);
      throw new Error(result.error || 'Erro ao fazer upload');
    }

    console.log("✅ Upload bem-sucedido via API:", result);

    setCustomImages({
      ...customImages,
      [type]: result.url,
    });

    console.log(`🎉 Upload ${type} concluído com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro no upload ${type}:`, error);
    alert(`Erro ao fazer upload da imagem ${type}. Tente novamente.`);
  } finally {
    setUploading(false);
  }
};
