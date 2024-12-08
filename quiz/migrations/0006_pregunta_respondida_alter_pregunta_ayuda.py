# Generated by Django 4.2.17 on 2024-12-08 14:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0005_pregunta_ayuda'),
    ]

    operations = [
        migrations.AddField(
            model_name='pregunta',
            name='respondida',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='pregunta',
            name='ayuda',
            field=models.TextField(blank=True, null=True),
        ),
    ]
