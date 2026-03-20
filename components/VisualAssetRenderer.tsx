import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import html2canvas from 'html2canvas';

interface VisualAssetRendererProps {
    asset: any;
    imageUrl: string;
}

export function VisualAssetRenderer({ asset, imageUrl }: VisualAssetRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!containerRef.current) return;

        try {
            const canvas = await html2canvas(containerRef.current, {
                useCORS: true,
                scale: 2, // Higher quality download
                backgroundColor: null,
            });

            const url = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.href = url;
            link.download = `imagen-${asset.id}-${asset.title}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading composition:', error);
            alert('Hubo un error al generar la imagen descargable.');
        }
    };

    const overlayData = asset.overlay_data || {};

    const renderTemplate = () => {
        switch (asset.type) {
            case 'benefit_infographic':
                return (
                    <div className="absolute inset-0 p-8 flex flex-col justify-between" style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        <div className="text-center mt-4">
                            <h2 className="text-4xl font-black uppercase tracking-wider mb-2">{overlayData.title}</h2>
                            {overlayData.subtitle && <h3 className="text-xl font-bold opacity-90">{overlayData.subtitle}</h3>}
                        </div>
                        <div className="flex-grow relative">
                            {(overlayData.callouts || []).map((callout: any, i: number) => {
                                let positionClasses = "";
                                switch (callout.position) {
                                    case 'top-left': positionClasses = "top-4 left-4 text-left max-w-[150px]"; break;
                                    case 'top-right': positionClasses = "top-4 right-4 text-right max-w-[150px]"; break;
                                    case 'bottom-left': positionClasses = "bottom-4 left-4 text-left max-w-[150px]"; break;
                                    case 'bottom-right': positionClasses = "bottom-4 right-4 text-right max-w-[150px]"; break;
                                    case 'center': positionClasses = "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-black/50 p-4 rounded-xl backdrop-blur-sm"; break;
                                    default: positionClasses = "top-4 left-4";
                                }
                                return (
                                    <div key={i} className={`absolute ${positionClasses}`}>
                                        <div className="bg-primary/90 text-primary-foreground text-xs md:text-sm font-bold px-3 py-1.5 rounded-full inline-block mb-1 border border-white/20 shadow-lg">
                                            {callout.text}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'recipe':
                return (
                    <div className="absolute inset-x-4 top-4 bottom-4 flex flex-col justify-end pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl space-y-4">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-white uppercase tracking-wider">{overlayData.title}</h2>
                                {overlayData.subtitle && <h3 className="text-sm font-bold text-white/80 mt-1">{overlayData.subtitle}</h3>}
                            </div>

                            <div className="grid grid-cols-2 gap-6 text-white text-sm">
                                {overlayData.ingredients && overlayData.ingredients.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-primary mb-2 uppercase text-xs tracking-widest border-b border-white/20 pb-1">Ingredientes</h4>
                                        <ul className="list-disc pl-4 space-y-1 opacity-90 text-xs">
                                            {overlayData.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {overlayData.preparation && overlayData.preparation.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-primary mb-2 uppercase text-xs tracking-widest border-b border-white/20 pb-1">Preparación</h4>
                                        <ol className="list-decimal pl-4 space-y-1 opacity-90 text-xs">
                                            {overlayData.preparation.map((prep: string, i: number) => <li key={i}>{prep}</li>)}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'lifestyle_banner':
                return (
                    <div className="absolute inset-0 p-8 flex items-center justify-start pointer-events-none">
                        <div className="max-w-[50%] bg-gradient-to-r from-black/80 to-transparent p-6 rounded-xl pointer-events-auto">
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider leading-tight mb-3">
                                {overlayData.title}
                            </h2>
                            {overlayData.subtitle && (
                                <p className="text-lg text-white/90 font-medium">
                                    {overlayData.subtitle}
                                </p>
                            )}
                            {(overlayData.callouts && overlayData.callouts.length > 0) && (
                                <div className="mt-4 space-y-2">
                                    {overlayData.callouts.map((c: any, i: number) => (
                                        <div key={i} className="flex gap-2 items-center text-white/80 text-sm font-bold">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                            {c.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                // single_image o fallback
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full h-full relative group items-center justify-center">
            <div
                ref={containerRef}
                className="relative w-full aspect-[4/5] bg-gray-100 dark:bg-gray-900 overflow-hidden rounded-md shadow-inner mx-auto max-h-[600px]"
            >
                <img
                    src={imageUrl}
                    alt={asset.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                />
                {renderTemplate()}
            </div>

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => {
                    const win = window.open();
                    if (win) {
                        win.document.write(`<iframe src="${imageUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    }
                }}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ver Base
                </Button>
                <Button size="sm" variant="secondary" onClick={handleDownload} className="font-bold text-purple-700">
                    <Download className="w-4 h-4 mr-1" />
                    Descargar Composición
                </Button>
            </div>
        </div >
    );
}
