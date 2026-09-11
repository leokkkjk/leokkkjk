import type { ComponentType } from "react";

import { PerfilBadge } from "@/components/perfil-badge";
import {
  IconeEquipes,
  IconeEscudo,
  IconePainel,
  IconeParceiro,
  IconePessoa,
} from "@/components/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PERFIL_INFO, PERFIS } from "@/lib/perfil";
import { contarPorPerfil, mapaSuperiores, usuariosVisiveis } from "@/lib/hierarquia";
import type { UsuarioAtual } from "@/lib/usuario-atual";
import { cn, iniciais } from "@/lib/utils";

/**
 * Prova prática da política de visibilidade da Fase 0.
 *
 * A lista abaixo é o resultado cru de um SELECT em `usuarios` com a sessão do
 * usuário logado — o RLS é quem corta as linhas. Serve para o Master/Gerente
 * conferirem na própria pele o que cada perfil enxerga.
 *
 * Nada de dashboard: os números são apenas as contagens da própria lista que a
 * query já devolvia (não existe métrica de produção nesta fase).
 */
export default async function PainelVisibilidade({
  usuario,
}: {
  usuario: UsuarioAtual;
}) {
  const lista = await usuariosVisiveis(usuario);
  const contagem = contarPorPerfil(lista);
  const superiores = mapaSuperiores(lista);
  const info = PERFIL_INFO[usuario.perfil];
  const equipes = PERFIS.filter((perfil) => contagem[perfil] > 0);

  return (
    <section className="space-y-5">
      {/* ---------------------------- resumo ---------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <CartaoResumo
          rotulo="Pessoas visíveis"
          valor={lista.length}
          icone={IconeEquipes}
          destaque
        />
        <CartaoResumo rotulo="Gerentes" valor={contagem.gerente} icone={IconePessoa} />
        <CartaoResumo rotulo="Vendedores" valor={contagem.vendedor} icone={IconePainel} />
        <CartaoResumo
          rotulo="Parceiros externos"
          valor={contagem.parceiro_externo}
          icone={IconeParceiro}
        />
      </div>

      {/* ------------------------ regra aplicada ------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-acento-50 text-acento-600">
              <IconeEscudo className="size-4" />
            </span>
            Regra de visibilidade aplicada
          </CardTitle>
          <CardDescription>{info.descricao}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <LinhaRotulo rotulo="Vê toda a empresa">
            <Badge variant={info.veTodaEmpresa ? "positivo" : "neutro"}>
              {info.veTodaEmpresa ? "sim" : "não"}
            </Badge>
          </LinhaRotulo>
          <LinhaRotulo rotulo="Vê a própria descendência">
            <Badge variant={info.veDescendencia ? "positivo" : "neutro"}>
              {info.veDescendencia ? "sim" : "não"}
            </Badge>
          </LinhaRotulo>
          <LinhaRotulo rotulo="Empresa (tenant)">
            <code className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-700">
              {usuario.empresaId}
            </code>
          </LinhaRotulo>
          <LinhaRotulo rotulo="Quem filtra">
            <Badge variant="acento">RLS no Postgres</Badge>
          </LinhaRotulo>
          <p className="m-0 text-xs leading-relaxed text-ink-500 sm:col-span-2">
            Policy <code className="font-mono text-[11px]">usuarios_select_hierarquia</code> — a
            tela apenas mostra o que o banco devolveu.
          </p>
        </CardContent>
      </Card>

      {/* ---------------------------- tabela ---------------------------- */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <CardTitle>Usuários visíveis para você</CardTitle>
              <CardDescription>
                Ordenados pela proximidade na hierarquia (0 é você).
              </CardDescription>
            </div>
            <Badge variant="neutro" className="tabular-nums">
              {lista.length} registro{lista.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {equipes.map((perfil) => (
              <span key={perfil} className="inline-flex items-center gap-1.5">
                <PerfilBadge perfil={perfil} curto size="sm" />
                <span className="text-xs text-ink-500 tabular-nums">{contagem[perfil]}</span>
              </span>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-0">
          {lista.length === 0 ? (
            <EstadoVazio />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-ink-50/60 hover:bg-ink-50/60">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="hidden lg:table-cell">Reporta para</TableHead>
                  <TableHead className="hidden sm:table-cell">Nível</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((u) => (
                  <TableRow key={u.id} data-destacado={u.id === usuario.id}>
                    <TableCell className="max-w-[16rem]">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar
                          className={cn(
                            "size-9",
                            u.id === usuario.id && "border-acento-200 bg-acento-50",
                          )}
                        >
                          <AvatarFallback
                            className={cn(u.id === usuario.id && "text-acento-700")}
                          >
                            {iniciais(u.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-ink-900">
                              {u.nome}
                            </span>
                            {u.id === usuario.id ? (
                              <span className="text-[11px] font-medium text-acento-600">
                                você
                              </span>
                            ) : null}
                          </span>
                          <span className="block truncate text-xs text-ink-500">{u.email}</span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <PerfilBadge perfil={u.perfil} />
                    </TableCell>
                    <TableCell className="hidden max-w-[12rem] truncate text-ink-700 lg:table-cell">
                      {u.reportsToId ? (superiores.get(u.id) ?? "—") : "—"}
                    </TableCell>
                    <TableCell className="hidden text-ink-700 tabular-nums sm:table-cell">
                      {u.profundidade === null ? "—" : u.profundidade}
                    </TableCell>
                    <TableCell>
                      {u.ativo ? (
                        <Badge variant="positivo">Ativo</Badge>
                      ) : (
                        <Badge variant="critico">Inativo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

/** Card de contagem do resumo — dado que a própria query já devolvia. */
function CartaoResumo({
  rotulo,
  valor,
  icone: Icone,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  icone: ComponentType<{ className?: string }>;
  destaque?: boolean;
}) {
  return (
    <Card className="gap-0 p-4 sm:p-5">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          destaque ? "bg-acento-50 text-acento-600" : "bg-ink-100 text-ink-500",
        )}
      >
        <Icone className="size-4" />
      </span>
      <p className="m-0 mt-3 text-2xl leading-none font-semibold text-ink-900 tabular-nums">
        {valor}
      </p>
      <p className="m-0 mt-1.5 text-xs leading-tight text-ink-500">{rotulo}</p>
    </Card>
  );
}

function LinhaRotulo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2">
      <span className="text-xs font-medium text-ink-600">{rotulo}</span>
      {children}
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <IconeEquipes className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="m-0 text-sm font-semibold text-ink-900">Nenhum usuário visível</p>
        <p className="m-0 max-w-sm text-xs leading-relaxed text-ink-500">
          A consulta não devolveu nenhuma linha. Se isso estiver errado, confira a policy{" "}
          <code className="font-mono">usuarios_select_hierarquia</code> e a linha do seu login na
          tabela <code className="font-mono">usuarios</code>.
        </p>
      </div>
    </div>
  );
}
