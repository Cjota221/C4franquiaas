"use client";

import { useState, useEffect } from 'react';
import { 
  GraduationCap,
  DollarSign,
  Truck,
  PieChart,
  Target,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import PromoLucroCerto from '@/components/revendedora/PromoLucroCerto';

// Tipos
type ModuleId = 'custos' | 'frete' | 'markup' | 'precificacao';

interface Module {
  id: ModuleId;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

// Módulos disponíveis
const modules: Module[] = [
  { 
    id: 'custos', 
    title: 'Entendendo seus Custos', 
    subtitle: 'Custo Fixo vs Variável',
    icon: DollarSign, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  { 
    id: 'frete', 
    title: 'O Segredo do Frete', 
    subtitle: 'Como diluir no preço',
    icon: Truck, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  },
  { 
    id: 'markup', 
    title: 'Markup x Margem', 
    subtitle: 'A pegadinha clássica',
    icon: PieChart, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  { 
    id: 'precificacao', 
    title: 'Formação de Preço', 
    subtitle: 'O preço ideal',
    icon: Target, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
];

// Componente Flip Card
function FlipCard({ back, frontTitle }: { back: string; frontTitle: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className="relative h-48 cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`
        relative w-full h-full transition-transform duration-500 preserve-3d
        ${flipped ? 'rotate-y-180' : ''}
      `}
      style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Frente */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 
                   flex flex-col items-center justify-center text-white backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Lightbulb className="w-10 h-10 mb-3 opacity-80" />
          <p className="text-lg font-bold text-center">{frontTitle}</p>
          <p className="text-sm opacity-80 mt-2">Toque para ver</p>
        </div>
        
        {/* Verso */}
        <div 
          className="absolute inset-0 bg-white border-2 border-gray-200 rounded-2xl p-6 
                   flex flex-col items-center justify-center rotate-y-180 backface-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <CheckCircle className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="text-gray-700 text-center text-sm leading-relaxed">{back}</p>
        </div>
      </div>
    </div>
  );
}

// Componente Accordion
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[1000px]' : 'max-h-0'}`}>
        <div className="p-4 pt-0 border-t border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}

// Componente Barra de Composição de Preço
function PriceCompositionBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-3">
      <div className="h-8 rounded-full overflow-hidden flex">
        {items.map((item, idx) => (
          <div 
            key={idx}
            className={`${item.color} flex items-center justify-center text-white text-xs font-bold`}
            style={{ width: `${(item.value / total) * 100}%` }}
          >
            {item.value}%
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-sm text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de Exemplo Visual
function ExampleBox({ type, title, description }: { type: 'good' | 'bad' | 'info'; title: string; description: string }) {
  const styles = {
    good: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-500' },
    bad: { bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, iconColor: 'text-red-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Lightbulb, iconColor: 'text-blue-500' },
  };
  
  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border-2 rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div>
          <p className="font-semibold text-gray-900 mb-1">{title}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Conteúdo dos módulos
function ModuleCustos() {
  return (
    <div className="space-y-8">
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 leading-relaxed">
          Entender a diferença entre <strong>custos fixos</strong> e <strong>custos variáveis</strong> é 
          o primeiro passo para precificar corretamente seus produtos.
        </p>
      </div>

      {/* Flip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FlipCard 
          frontTitle="O que é Custo Fixo?"
          back="São despesas que você paga TODO MÊS, vendendo ou não: aluguel, internet, MEI, luz do escritório, celular comercial."
        />
        <FlipCard 
          frontTitle="O que é Custo Variável?"
          back="São custos que mudam conforme você vende: embalagem, frete, comissão de vendas, etiquetas, sacolas."
        />
      </div>

      {/* Accordions */}
      <div className="space-y-3">
        <Accordion title="Por que isso importa para o preço?" defaultOpen>
          <p className="text-gray-600 mb-4">
            Se você não incluir uma parte dos seus custos fixos no preço de cada produto, 
            no final do mês você pode vender muito e mesmo assim não sobrar dinheiro!
          </p>
          <ExampleBox 
            type="bad"
            title="Erro comum"
            description="Vender produto por R$ 50 achando que lucrou R$ 20, mas esquecendo que R$ 15 do aluguel veio desse lucro."
          />
        </Accordion>
        
        <Accordion title="Como calcular o custo fixo por produto?">
          <div className="space-y-4">
            <p className="text-gray-600">
              Divida seus custos fixos mensais pela quantidade média de produtos vendidos:
            </p>
            <div className="bg-gray-100 rounded-xl p-4 font-mono text-center">
              <p className="text-lg">Custo Fixo Unitário = Custos Fixos ÷ Qtd. Vendida</p>
              <p className="text-gray-500 mt-2">R$ 500 ÷ 100 peças = <span className="text-pink-600 font-bold">R$ 5/peça</span></p>
            </div>
          </div>
        </Accordion>
      </div>

      <PromoLucroCerto context="Quer calcular isso automaticamente?" />
    </div>
  );
}

function ModuleFrete() {
  return (
    <div className="space-y-8">
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 leading-relaxed">
          O frete pode <strong>destruir sua margem</strong> se você não souber diluí-lo corretamente 
          no preço de cada peça.
        </p>
      </div>

      {/* Alerta */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">O erro que 90% das revendedoras cometem</h3>
            <p className="text-gray-600">
              Comprar 10 peças por R$ 300 + R$ 50 de frete e achar que cada peça custou R$ 30. 
              Na verdade, custou <span className="font-bold text-amber-700">R$ 35!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Cálculo visual */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Como fazer certo:</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Valor das peças</p>
              <p className="text-2xl font-bold text-gray-900">R$ 300</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Frete total</p>
              <p className="text-2xl font-bold text-amber-600">R$ 50</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Custo REAL</p>
              <p className="text-2xl font-bold text-emerald-600">R$ 350</p>
            </div>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Custo unitário correto (10 peças)</p>
            <p className="text-3xl font-bold text-pink-600">R$ 35,00</p>
          </div>
        </div>
      </div>

      <Accordion title="Dica: Compre em maior quantidade">
        <p className="text-gray-600 mb-4">
          Quanto mais peças você compra, mais o frete se dilui:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ExampleBox 
            type="bad"
            title="5 peças + R$ 50 frete"
            description="Frete por peça: R$ 10,00"
          />
          <ExampleBox 
            type="good"
            title="20 peças + R$ 50 frete"
            description="Frete por peça: R$ 2,50"
          />
        </div>
      </Accordion>

      <PromoLucroCerto context="O Lucro Certo calcula o frete automaticamente!" />
    </div>
  );
}

function ModuleMarkup() {
  return (
    <div className="space-y-8">
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 leading-relaxed">
          <strong>Markup</strong> e <strong>Margem de Lucro</strong> parecem a mesma coisa, 
          mas confundir os dois pode fazer você perder dinheiro sem perceber.
        </p>
      </div>

      {/* Comparação visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
          <h3 className="font-bold text-purple-800 text-lg mb-4">Markup (Multiplicador)</h3>
          <p className="text-gray-600 mb-4">
            É quanto você <strong>multiplica</strong> o custo para chegar ao preço de venda.
          </p>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Custo R$ 50 × Markup 2.0</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">Preço: R$ 100</p>
          </div>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
          <h3 className="font-bold text-emerald-800 text-lg mb-4">Margem de Lucro (%)</h3>
          <p className="text-gray-600 mb-4">
            É a porcentagem do <strong>preço de venda</strong> que é lucro.
          </p>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Preço R$ 100 - Custo R$ 50</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">Margem: 50%</p>
          </div>
        </div>
      </div>

      {/* A pegadinha */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <h3 className="font-bold text-red-800 text-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          A Pegadinha
        </h3>
        <p className="text-gray-700 mb-4">
          Muita gente acha que aplicar 100% de markup = 100% de margem. <strong>ERRADO!</strong>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Markup 100%</p>
            <p className="text-xl font-bold text-red-600">Margem: 50%</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">Markup 50%</p>
            <p className="text-xl font-bold text-red-600">Margem: 33%</p>
          </div>
        </div>
      </div>

      <Accordion title="Tabela de conversão Markup → Margem" defaultOpen>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-semibold">Markup</th>
                <th className="text-left py-2 font-semibold">Margem Real</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-2">30%</td><td className="py-2 text-emerald-600">23%</td></tr>
              <tr><td className="py-2">50%</td><td className="py-2 text-emerald-600">33%</td></tr>
              <tr><td className="py-2">100%</td><td className="py-2 text-emerald-600">50%</td></tr>
              <tr><td className="py-2">150%</td><td className="py-2 text-emerald-600">60%</td></tr>
              <tr><td className="py-2">200%</td><td className="py-2 text-emerald-600">67%</td></tr>
            </tbody>
          </table>
        </div>
      </Accordion>

      <PromoLucroCerto context="Confuso? O Lucro Certo faz a conversão automática!" />
    </div>
  );
}

function ModulePrecificacao() {
  return (
    <div className="space-y-8">
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 leading-relaxed">
          Agora que você entende custos, frete e margem, vamos montar o 
          <strong> preço de venda ideal</strong>.
        </p>
      </div>

      {/* Composição do preço */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-6">Composição do Preço de Venda</h3>
        <PriceCompositionBar 
          items={[
            { label: 'Custo da Peça', value: 40, color: 'bg-blue-500' },
            { label: 'Frete Diluído', value: 10, color: 'bg-amber-500' },
            { label: 'Custos Fixos', value: 10, color: 'bg-purple-500' },
            { label: 'Impostos', value: 10, color: 'bg-gray-500' },
            { label: 'Lucro Líquido', value: 30, color: 'bg-emerald-500' },
          ]}
        />
      </div>

      {/* Fórmula */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-200">
        <h3 className="font-bold text-gray-900 mb-4">A Fórmula Simplificada</h3>
        <div className="bg-white rounded-xl p-6 text-center">
          <p className="font-mono text-lg text-gray-700 mb-4">
            Preço = (Custo + Frete + Fixos) ÷ (1 - Margem%)
          </p>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-2">Exemplo: Custo R$ 50 + Frete R$ 5 + Fixos R$ 5 = R$ 60</p>
            <p className="text-sm text-gray-500 mb-2">Margem desejada: 40%</p>
            <p className="text-2xl font-bold text-pink-600">
              R$ 60 ÷ 0,60 = <span className="text-3xl">R$ 100,00</span>
            </p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
        <h3 className="font-bold text-emerald-800 mb-4">Checklist antes de definir o preço</h3>
        <ul className="space-y-3">
          {[
            'Incluí o custo da peça?',
            'Dilu o frete no custo unitário?',
            'Rateei meus custos fixos?',
            'Considerei impostos (se aplicável)?',
            'A margem cobre meu lucro desejado?',
            'O preço está competitivo no mercado?'
          ].map((item, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <PromoLucroCerto context="Quer que um sistema faça tudo isso por você?" />
    </div>
  );
}

// Página principal
export default function AcademyPage() {
  const [activeModule, setActiveModule] = useState<ModuleId>('custos');

  useEffect(() => {
    document.title = "C4 Academy | Aprenda a Precificar";
  }, []);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'custos': return <ModuleCustos />;
      case 'frete': return <ModuleFrete />;
      case 'markup': return <ModuleMarkup />;
      case 'precificacao': return <ModulePrecificacao />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-purple-300 font-semibold">C4 Academy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Domine o Financeiro do seu Negócio
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Aprenda a precificar corretamente, entender suas margens e nunca mais 
            vender no prejuízo sem saber.
          </p>
        </div>
      </div>

      {/* Trilhas de Conhecimento */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`
                  relative p-4 rounded-2xl transition-all text-left
                  ${isActive 
                    ? 'bg-white shadow-xl ring-2 ring-pink-500' 
                    : 'bg-white shadow-md hover:shadow-lg'
                  }
                `}
              >
                <div className={`w-10 h-10 ${module.bgColor} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${module.color}`} />
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{module.title}</p>
                <p className="text-xs text-gray-500">{module.subtitle}</p>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 
                                border-l-8 border-r-8 border-t-8 
                                border-l-transparent border-r-transparent border-t-pink-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo do Módulo */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-5 h-5 text-pink-500" />
          <span className="text-sm font-semibold text-pink-600 uppercase tracking-wide">
            {modules.find(m => m.id === activeModule)?.title}
          </span>
        </div>
        
        {renderModuleContent()}

        {/* Navegação entre módulos */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                const idx = modules.findIndex(m => m.id === activeModule);
                if (idx > 0) setActiveModule(modules[idx - 1].id);
              }}
              disabled={activeModule === modules[0].id}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Anterior
            </button>
            
            <div className="flex gap-2">
              {modules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    activeModule === m.id ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                const idx = modules.findIndex(m => m.id === activeModule);
                if (idx < modules.length - 1) setActiveModule(modules[idx + 1].id);
              }}
              disabled={activeModule === modules[modules.length - 1].id}
              className="flex items-center gap-2 px-4 py-2 text-pink-600 hover:text-pink-700 
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Próximo
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Banner Fixo no Rodapé - acima da bottom nav */}
      <div className="sticky bottom-20 left-0 right-0 px-4 pb-2 lg:hidden">
        <PromoLucroCerto variant="banner" />
      </div>

      {/* Sidebar Promo (Desktop) */}
      <div className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 w-72 z-30">
        <PromoLucroCerto variant="sidebar" />
      </div>
    </div>
  );
}
