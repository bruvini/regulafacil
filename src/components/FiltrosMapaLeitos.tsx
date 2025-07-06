
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SlidersHorizontal, X } from 'lucide-react';

export const FiltrosMapaLeitos = () => {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    // No futuro, os valores dos filtros virão de props e o estado será gerenciado na página pai

    return (
        <Card className="shadow-card border border-border/50">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-medical-primary">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Pesquisar por paciente ou leito..." />
                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="text-sm">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filtros Avançados
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 p-4 border rounded-lg space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Especialidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cardiologia">Cardiologia</SelectItem>
                                    <SelectItem value="neurologia">Neurologia</SelectItem>
                                    <SelectItem value="ortopedia">Ortopedia</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Setor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="uti">UTI</SelectItem>
                                    <SelectItem value="enfermaria">Enfermaria</SelectItem>
                                    <SelectItem value="emergencia">Emergência</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sexo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="masculino">Masculino</SelectItem>
                                    <SelectItem value="feminino">Feminino</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vago">Vago</SelectItem>
                                    <SelectItem value="ocupado">Ocupado</SelectItem>
                                    <SelectItem value="higienizacao">Higienização</SelectItem>
                                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="md:col-span-2">
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Isolamento (múltipla seleção em breve)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="contato">Contato</SelectItem>
                                        <SelectItem value="respiratorio">Respiratório</SelectItem>
                                        <SelectItem value="goticular">Goticular</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            <X className="mr-2 h-4 w-4"/>
                            Limpar Filtros
                        </Button>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};
