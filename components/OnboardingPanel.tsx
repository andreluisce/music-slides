import React, { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Folder, CaretLeft, CaretRight, Check } from '@phosphor-icons/react';

interface OnboardingPanelProps {
  onComplete?: () => void;
}

export default function OnboardingPanel({ onComplete }: OnboardingPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [language, setLanguage] = useState('pt-BR');
  const [use24Hour, setUse24Hour] = useState(false);
  const [dataPath, setDataPath] = useState('Documents/LyricsShow');
  const [isSelectingPath, setIsSelectingPath] = useState(false);

  const totalSteps = 4;

  const handleSelectDataPath = async () => {
    try {
      setIsSelectingPath(true);

      // Check if in Electron environment
      if ((window as any).api?.selectDataPath) {
        const result = await (window as any).api.selectDataPath();
        if (result && !result.canceled && result.filePath) {
          setDataPath(result.filePath);
        }
      } else {
        // In browser mode, just show a prompt for demo
        const customPath = prompt('Digite o caminho da pasta (apenas para demo):', dataPath);
        if (customPath) {
          setDataPath(customPath);
        }
      }
    } catch (error) {
      console.error('Error selecting data path:', error);
    } finally {
      setIsSelectingPath(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      // Check if running in Electron
      const isElectron = !!(window as any).api?.updateSettings;

      if (isElectron) {
        // Save settings to Supabase via IPC
        await (window as any).api.updateSettings({
          language,
          use24Hour,
          dataPath,
          lyricsPath: `${dataPath}/songs`,
          imagesPath: `${dataPath}/images`,
          videosPath: `${dataPath}/videos`,
        });

        // Mark onboarding as complete
        await (window as any).api.setSetting('onboardingCompleted', true);

        console.log('✅ Onboarding completed successfully in Electron');
      } else {
        // In browser mode, save to localStorage for testing
        localStorage.setItem('onboardingCompleted', 'true');
        localStorage.setItem('onboardingSettings', JSON.stringify({
          language,
          use24Hour,
          dataPath,
        }));

        console.log('✅ Onboarding completed successfully in browser mode');
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo!</h2>
              <p className="text-slate-300">
                Vamos configurar o Lyrics Show em apenas alguns passos simples.
              </p>
            </div>
            <div className="bg-purple-900/30 p-6 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-magenta rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-white font-semibold">Idioma</h3>
                  <p className="text-slate-400 text-sm">Escolha o idioma do aplicativo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-magenta rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-white font-semibold">Formato de Hora</h3>
                  <p className="text-slate-400 text-sm">Configure como você prefere ver as horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-magenta rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-white font-semibold">Pasta de Dados</h3>
                  <p className="text-slate-400 text-sm">Onde seus arquivos serão salvos</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Idioma</h2>
              <p className="text-slate-300">
                Selecione o idioma do aplicativo
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setLanguage('pt-BR')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  language === 'pt-BR'
                    ? 'border-magenta bg-magenta/20 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🇧🇷 Português (Brasil)</span>
                  {language === 'pt-BR' && <Check size={24} weight="bold" />}
                </div>
              </button>
              <button
                onClick={() => setLanguage('en-US')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  language === 'en-US'
                    ? 'border-magenta bg-magenta/20 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🇺🇸 English (United States)</span>
                  {language === 'en-US' && <Check size={24} weight="bold" />}
                </div>
              </button>
              <button
                onClick={() => setLanguage('es-ES')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  language === 'es-ES'
                    ? 'border-magenta bg-magenta/20 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🇪🇸 Español</span>
                  {language === 'es-ES' && <Check size={24} weight="bold" />}
                </div>
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Formato de Hora</h2>
              <p className="text-slate-300">
                Como você prefere ver as horas?
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setUse24Hour(false)}
                className={`w-full p-6 rounded-lg border-2 transition-all ${
                  !use24Hour
                    ? 'border-magenta bg-magenta/20 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-xl font-semibold mb-1">12 horas</div>
                    <div className="text-sm text-slate-400">Exemplo: 3:45 PM</div>
                  </div>
                  {!use24Hour && <Check size={24} weight="bold" />}
                </div>
              </button>
              <button
                onClick={() => setUse24Hour(true)}
                className={`w-full p-6 rounded-lg border-2 transition-all ${
                  use24Hour
                    ? 'border-magenta bg-magenta/20 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-xl font-semibold mb-1">24 horas</div>
                    <div className="text-sm text-slate-400">Exemplo: 15:45</div>
                  </div>
                  {use24Hour && <Check size={24} weight="bold" />}
                </div>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Pasta de Dados</h2>
              <p className="text-slate-300">
                Escolha onde seus arquivos serão salvos
              </p>
            </div>
            <div className="bg-purple-900/30 p-6 rounded-lg space-y-4">
              <Label className="text-white text-lg">Localização Atual:</Label>
              <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-lg">
                <Folder size={24} className="text-magenta flex-shrink-0" />
                <span className="text-slate-300 break-all">{dataPath}</span>
              </div>
              <Button
                onClick={handleSelectDataPath}
                disabled={isSelectingPath}
                variant="outline"
                className="w-full"
              >
                {isSelectingPath ? 'Selecionando...' : 'Escolher Outra Pasta'}
              </Button>
              <div className="text-sm text-slate-400 space-y-2">
                <p>📁 Esta pasta conterá:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>songs/ - Suas letras de música</li>
                  <li>images/ - Imagens de fundo</li>
                  <li>videos/ - Vídeos de fundo</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-6 bg-gradient-to-br from-purple-900 to-black">
      <div className="w-full max-w-2xl bg-black/20 p-8 rounded-lg shadow-2xl backdrop-blur-md">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-12 bg-magenta'
                    : index < currentStep
                    ? 'w-8 bg-magenta/50'
                    : 'w-8 bg-slate-600'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-slate-400 mt-3 text-sm">
            Passo {currentStep + 1} de {totalSteps}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 gap-4">
          <Button
            onClick={handleBack}
            disabled={currentStep === 0}
            variant="outline"
            className="flex items-center gap-2 border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
          >
            <CaretLeft size={20} />
            Voltar
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-magenta hover:bg-magenta-600"
            >
              Próximo
              <CaretRight size={20} />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="flex items-center gap-2 bg-magenta hover:bg-magenta-600"
            >
              <Check size={20} weight="bold" />
              Concluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
