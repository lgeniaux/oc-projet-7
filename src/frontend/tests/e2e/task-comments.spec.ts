import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const apiURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

for (const width of [1440, 375]) {
  test(`publishes a task comment without reloading or overflowing at ${width}px`, async ({
    page,
    request,
  }) => {
    const id = randomUUID();
    const projectName = `Commentaires ${id}`;
    const taskTitle = "Préparer la publication";
    const content = `La publication est prête.\nRéférence : ${id}.`;
    const authentication = await request.post(`${apiURL}/auth/login`, {
      data: { email: "alice@example.com", password: "P@ssword123" },
    });
    expect(authentication.status()).toBe(200);
    const authenticationBody: { data: { token: string } } =
      await authentication.json();
    const headers = {
      Authorization: `Bearer ${authenticationBody.data.token}`,
    };
    let projectId: string | undefined;

    try {
      // Only disposable records are changed; the public seed account is unchanged.
      const creation = await request.post(`${apiURL}/projects`, {
        headers,
        data: {
          name: projectName,
          description: "Projet jetable pour le parcours de commentaire.",
        },
      });
      const creationBody: { data: { project: { id: string } } } =
        await creation.json();
      projectId = creationBody.data.project.id;
      expect(creation.status()).toBe(201);
      const taskCreation = await request.post(
        `${apiURL}/projects/${projectId}/tasks`,
        {
          headers,
          data: { title: taskTitle, description: "Vérifier les commentaires." },
        },
      );
      expect(taskCreation.status()).toBe(201);
      const taskBody: { data: { task: { id: string } } } =
        await taskCreation.json();
      const commentsURL = `${apiURL}/projects/${projectId}/tasks/${taskBody.data.task.id}/comments`;

      await page.setViewportSize({ width, height: 900 });
      await page.goto("/login");
      await page
        .getByRole("textbox", { name: "E-mail", exact: true })
        .fill("alice@example.com");
      await page
        .getByLabel("Mot de passe", { exact: true })
        .fill("P@ssword123");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL("/");
      await page.getByRole("link", { name: "Projets", exact: true }).click();
      await page.getByRole("link", { name: projectName, exact: true }).click();
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: projectName,
          exact: true,
        }),
      ).toBeVisible();
      const taskCard = page
        .getByRole("region", { name: "Tâches", exact: true })
        .getByRole("listitem")
        .filter({
          has: page.getByRole("heading", {
            level: 3,
            name: taskTitle,
            exact: true,
          }),
        });
      const disclosure = taskCard.getByRole("button", {
        name: /^Commentaires \(\d+\)$/,
      });
      await expect(disclosure).toHaveText("Commentaires (0)");
      await disclosure.focus();
      await page.keyboard.press("Enter");
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
      const input = taskCard.getByRole("textbox", {
        name: "Ajouter un commentaire",
        exact: true,
      });
      await expect(input).toBeVisible();
      await page.evaluate(() => {
        document.documentElement.dataset.commentJourney = "same-document";
      });
      await input.fill(`  ${content}  `);
      const publication = page.waitForResponse(
        (response) =>
          response.url() === commentsURL &&
          response.request().method() === "POST",
      );
      await taskCard
        .getByRole("button", { name: "Publier le commentaire", exact: true })
        .click();
      expect((await publication).status()).toBe(201);

      await expect(taskCard.getByRole("status")).toHaveText(
        "Commentaire publié.",
      );
      await expect(disclosure).toHaveText("Commentaires (1)");
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
      const comments = taskCard.getByRole("list", {
        name: "Commentaires",
        exact: true,
      });
      await expect(comments.getByRole("listitem")).toHaveCount(1);
      await expect(comments.getByText(content, { exact: true })).toBeVisible();
      await expect(input).toHaveValue("");
      expect(
        await page.evaluate(
          () => document.documentElement.dataset.commentJourney,
        ),
      ).toBe("same-document");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: test.info().outputPath(`task-comment-${width}.png`),
        fullPage: true,
      });
    } finally {
      if (projectId) {
        const deletion = await request.delete(
          `${apiURL}/projects/${projectId}`,
          {
            headers,
          },
        );
        expect(deletion.status()).toBe(200);
      }
    }
  });
}
