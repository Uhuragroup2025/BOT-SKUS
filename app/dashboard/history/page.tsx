"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, MoreHorizontal, Download, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const historyData = [
    {
        id: "1",
        product: "Zapatillas Running Pro X1",
        category: "Deportes",
        date: "15 Ene 2026",
        score: 92,
        status: "Optimizado"
    },
    {
        id: "2",
        product: "Auriculares Noise Cancelling",
        category: "Tecnología",
        date: "14 Ene 2026",
        score: 88,
        status: "Optimizado"
    },
    {
        id: "3",
        product: "Crema Hidratante Bio 50ml",
        category: "Belleza",
        date: "12 Ene 2026",
        score: 95,
        status: "Optimizado"
    },
    {
        id: "4",
        product: "Silla Ergonómica Oficina",
        category: "Muebles",
        date: "10 Ene 2026",
        score: 78,
        status: "Revisar"
    },
    {
        id: "5",
        product: "Cafetera Italiana Inox",
        category: "Hogar",
        date: "08 Ene 2026",
        score: 85,
        status: "Optimizado"
    }
];

export default function HistoryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Historial de Fichas</h1>
                    <p className="text-muted-foreground">Gestiona y descarga tus contenidos generados previamente.</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Producto</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Score IA</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historyData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-primary/10 rounded-md text-primary">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            {item.product}
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center font-bold text-sm">
                                            <span className={item.score > 90 ? "text-green-600" : item.score > 80 ? "text-blue-600" : "text-yellow-600"}>
                                                {item.score}
                                            </span>
                                            <span className="text-muted-foreground font-normal">/100</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === "Optimizado" ? "default" : "secondary"} className={item.status === "Optimizado" ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem>
                                                    <Eye className="mr-2 h-4 w-4" /> Ver ficha completa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
