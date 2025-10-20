
// debug-tools/debug-layout.js

/**
 * Ferramenta de diagnóstico de layout para identificar e relatar possíveis problemas de CSS e estrutura no DOM.
 * 
 * Como usar:
 * 1. Injete este script na sua página.
 * 2. Chame `window.runLayoutAnalysis()` no console do navegador.
 * 3. Os resultados serão exibidos no console e um relatório JSON será gerado.
 */

(function() {
  console.log("Debug Layout Tool Loaded.");

  /**
   * Retorna uma representação simplificada de um seletor para um elemento.
   * @param {Element} el O elemento do DOM.
   * @returns {string} Um seletor CSS simplificado.
   */
  function getSelector(el) {
    if (!el) return "null";
    let selector = el.tagName.toLowerCase();
    if (el.id) {
      selector += `#${el.id}`;
    }
    if (el.className && typeof el.className === 'string') {
      selector += `.${el.className.trim().replace(/\s+/g, '.')}`;
    }
    return selector;
  }

  /**
   * Coleta informações computadas de estilo relevantes para o layout.
   * @param {Element} element O elemento do DOM.
   * @returns {Object} Um objeto com as propriedades de estilo computadas.
   */
  function getComputedStyleInfo(element) {
    const style = window.getComputedStyle(element);
    return {
      display: style.display,
      position: style.position,
      zIndex: style.zIndex,
      width: style.width,
      height: style.height,
      marginTop: style.marginTop,
      marginRight: style.marginRight,
      marginBottom: style.marginBottom,
      marginLeft: style.marginLeft,
      paddingTop: style.paddingTop,
      paddingRight: style.paddingRight,
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft,
      overflow: style.overflow,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      visibility: style.visibility,
      opacity: style.opacity,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      color: style.color,
      backgroundColor: style.backgroundColor,
      border: style.border,
    };
  }

  /**
   * Coleta informações básicas e de layout de um elemento.
   * @param {Element} element O elemento do DOM.
   * @returns {Object} Um objeto com informações do elemento.
   */
  function getElementInfo(element) {
    const rect = element.getBoundingClientRect();
    return {
      selector: getSelector(element),
      tag: element.tagName,
      id: element.id,
      classes: element.className,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      computedStyle: getComputedStyleInfo(element),
      hasChildren: element.children.length > 0,
      childrenCount: element.children.length,
      // Adiciona o HTML interno para contexto, mas limita o tamanho
      innerHTML_snippet: element.innerHTML.substring(0, 100) + (element.innerHTML.length > 100 ? '...' : ''),
    };
  }

  /**
   * Percorre o DOM a partir de um nó raiz e coleta informações de layout.
   * @param {Element} rootNode O nó a partir do qual a análise começa.
   * @returns {Array} Uma lista de objetos com informações dos elementos.
   */
  function analyzeDOM(rootNode = document.body) {
    const elementsData = [];
    const elementsToScan = rootNode.querySelectorAll('*');
    
    elementsToScan.forEach(el => {
      // Ignora scripts e estilos para não poluir o relatório
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
        return;
      }
      elementsData.push(getElementInfo(el));
    });

    return elementsData;
  }

  /**
   * Analisa os dados coletados para detectar problemas comuns de layout.
   * @param {Array} elementsData A lista de dados dos elementos.
   * @returns {Object} Um objeto contendo listas de problemas detectados.
   */
  function detectLayoutIssues(elementsData) {
    const issues = {
      highZIndex: [],
      overflowHidden: [],
      overflowScroll: [],
      absolutePosition: [],
      fixedPosition: [],
      largeNegativeMargin: [],
      inlineBlockWithIssues: [],
      potentialFontIssues: [],
      zeroSizeElements: [],
    };

    elementsData.forEach(data => {
      const style = data.computedStyle;

      // 1. Z-index alto
      const zIndex = parseInt(style.zIndex, 10);
      if (!isNaN(zIndex) && zIndex > 1000) {
        issues.highZIndex.push({ selector: data.selector, zIndex });
      }

      // 2. Elementos com overflow hidden (podem esconder conteúdo)
      if (style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden') {
        if (data.rect.width > 0 && data.rect.height > 0) { // Apenas se for visível
            issues.overflowHidden.push({ selector: data.selector, rect: data.rect });
        }
      }
      
      // 3. Elementos com scroll (podem indicar quebras de layout)
      if (style.overflow === 'scroll' || style.overflowX === 'scroll' || style.overflowY === 'scroll') {
         issues.overflowScroll.push({ selector: data.selector, rect: data.rect });
      }

      // 4. Posição absoluta e fixa
      if (style.position === 'absolute') {
        issues.absolutePosition.push({ selector: data.selector, rect: data.rect });
      }
      if (style.position === 'fixed') {
        issues.fixedPosition.push({ selector: data.selector, rect: data.rect });
      }

      // 5. Margens negativas grandes
      const margins = [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft].map(m => parseInt(m, 10));
      if (margins.some(m => m < -50)) {
        issues.largeNegativeMargin.push({ selector: data.selector, margins: { top: style.marginTop, right: style.marginRight, bottom: style.marginBottom, left: style.marginLeft } });
      }

      // 6. Problemas com inline-block
      if (style.display === 'inline-block' && style.verticalAlign !== 'top') {
        // issues.inlineBlockWithIssues.push({ selector: data.selector, verticalAlign: style.verticalAlign });
      }
      
      // 7. Fontes muito pequenas ou muito grandes
      const fontSize = parseFloat(style.fontSize);
      if (fontSize < 12 && data.rect.width > 0) {
          issues.potentialFontIssues.push({ selector: data.selector, fontSize: style.fontSize, text: data.innerHTML_snippet.substring(0, 50) });
      }

      // 8. Elementos com tamanho zero mas com filhos (potencialmente ocultos)
      if (data.rect.width === 0 || data.rect.height === 0) {
          if(data.hasChildren) {
            issues.zeroSizeElements.push({ selector: data.selector, childrenCount: data.childrenCount });
          }
      }
    });

    return issues;
  }

  /**
   * Orquestra a análise e gera o relatório final.
   */
  function runLayoutAnalysis() {
    console.log("Starting layout analysis...");
    
    const allElementsData = analyzeDOM();
    const detectedIssues = detectLayoutIssues(allElementsData);
    
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      analysis: {
        totalElementsAnalyzed: allElementsData.length,
        issuesFound: Object.keys(detectedIssues).reduce((acc, key) => acc + detectedIssues[key].length, 0),
      },
      issues: detectedIssues,
      // rawData: allElementsData, // Descomente para incluir todos os dados brutos
    };

    console.log("Layout Analysis Report:", report);
    
    // Tenta salvar o relatório como um arquivo JSON
    try {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `layout-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log("Report JSON file download initiated.");
    } catch (e) {
      console.error("Failed to download report JSON.", e);
    }

    return report;
  }

  // Expõe a função principal ao escopo global
  window.runLayoutAnalysis = runLayoutAnalysis;

})();
