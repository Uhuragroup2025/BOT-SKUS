"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">Administra tu cuenta y preferencias de la aplicación.</p>
            </div>

            <Tabs defaultValue="account" className="w-full">
                <TabsList>
                    <TabsTrigger value="account">Cuenta</TabsTrigger>
                    <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                    <TabsTrigger value="team">Equipo</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil de Usuario</CardTitle>
                            <CardDescription>
                                Actualiza tu información personal y correo electrónico.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre completo</Label>
                                <Input id="name" defaultValue={user?.name || "Usuario Demo"} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input id="email" defaultValue={user?.email || "hola@demo.com"} disabled />
                                <p className="text-xs text-muted-foreground">El correo está vinculado a tu suscripción y no se puede cambiar directamente.</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Guardar cambios</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Seguridad</CardTitle>
                            <CardDescription>
                                Cambia tu contraseña o habilita la autenticación en dos pasos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current">Contraseña actual</Label>
                                <Input id="current" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new">Nueva contraseña</Label>
                                <Input id="new" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline">Actualizar contraseña</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferencias de Email</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Configuración de notificaciones próximamente...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Equipo (Plan Pro)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Puedes invitar a 2 miembros más en tu plan actual.</p>
                            <Button className="mt-4" variant="outline">+ Invitar miembro</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
