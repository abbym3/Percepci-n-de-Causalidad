' Imports System.IO

' Public Class Form1
'     'archivo de texto para guardar el registro del experimento
'     Public TXT As StreamWriter 
    
'     'controlan los tiempos del experimento
'     Public InicioEntrenamiento As Integer 
'     Public tiempo_entrenamiento As Integer
'     Public Tiempo_actual As Integer

'     'estadísticas del desempeño
'     Public CEH As Integer
'     Public CER As Integer
'     Public Aciertos As Integer
'     Public Errores As Integer

    ' 'control de estado.
    ' 'Public booleano As Boolean = False 'No esta en uso(?)
    ' Public BanderaD As Boolean = False
    ' Public permiso As Boolean = True 'Bloquea o permite la accion Timer3

    ' 'manejan cuánto esperar antes de cambiar el estímulo.
    ' Public ContadorDemora As Integer
    ' Public ValorDemora As String

    ' Public Entrenamiento As String = "entrenamiento"
    ' Public DemoraInicia As Integer
    ' Public DemoraActual As Integer

    ' Public tr As Integer ' Toques 
    ' Public pr As Integer ' Pulsos 
    ' Public promedio As Integer
    ' Public promedioRedondeado As Double
    ' Public score As Integer

    ' Public derecha As Integer
    ' Public izquierda As Integer
    ' Public verde As Integer
    ' Public rojo As Integer

    ' Public contador As Integer

    ' Public dado_human As Integer 'resultado del dado que determina si se apagará la tecla tras presionar.

    ' Public dcolor As Integer

    ' Public Duracion_Ref As Integer 'duración del refuerzo

    ' Public Demora As Integer
    ' Public n As Integer 'ciclos del Timer3
    ' Public b As Integer 'clicks acumulados en un bloque
    ' 'Public D As Integer 'no se usa(?)
    ' Public dado1 As Integer 'resultado de función Dado_1
    ' Public dado_rob As Integer 'dado de la computadora
    
    

    'Private Sub Form1_Load(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles MyBase.Load  'se ejecuta cuando se abre la ventana
        'TXT = File.CreateText("C:\Causalidad\Experimentos\Probabilidades\P.75\" & "experimento" & ".txt") 'se puede sobreescribir
        'TXT.WriteLine("Momento de inicio de sesión: " & DateTime.Now)
        'TXT.WriteLine("Subject: ")
        'TXT.WriteLine()
    'End Sub

    'Private Sub Empecemos_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles Empecemos.Click 'Se ejecuta con click al boton Empecemos
        'Inicia.Visible = False 'Asumo que es un label que muestra la palabra iniciar
        'Timer3.Start() 'es un objeto System.Windows.Forms.Timer  lanza eventos en intervalos definidos (por ejemplo, cada 100 ms)

        'Button1.Visible = True 'Al inicio el boton del centro es visible 
        'BtnIzqOff.Visible = True 'Botones laterales en estado apagado se muestran
        'BtnDerOff.Visible = True
        Label9.Visible = True 'muestra cuánto tiempo lleva el entrenamiento en milisegundos

        'Empecemos.Visible = False 'Oculta el boton de Empecemos
        'InicioEntrenamiento = Environment.TickCount 'Guarda el momento exacto en que el usuario hace clic en “Empecemos”

        'Este es un bucle infinito
        'Do
            'Tiempo_actual = Environment.TickCount
            'tiempo_entrenamiento = (Tiempo_actual - InicioEntrenamiento) 'Mide cuánto tiempo ha pasado desde que pulso Empecemos click
            Label9.Text = tiempo_entrenamiento

            If dado_human = 1 Then 'es una variable que se activa cuando el usuario presiona el botón central y el dado da 1. 
                DemorActual = Environment.TickCount 'El tiempo actual en cada ciclo del bucle.
                Demora = DemorActual - DemorInicia 'La diferencia entre DemorActual y DemoraInicia, o sea, cuánto tiempo ha pasado desde que se empezó a esperar.
                Label4.Text = Demora
                If Demora >= ValorDemora Then
                    Cambio_estímuloH()
                End If
            End If
            My.Application.DoEvents() 'Esto permite que la interfaz responda mientras se ejecuta el bucle
        'Loop
    'End Sub

    Private Sub Button1_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles Button1.Click 'Cuando se le da click a button 1
        TXT.WriteLine(tiempo_entrenamiento & ";Centro") 'Se registra el tiempo de entrenamiento (Desde el inicio) y el evento centro
        tr = tr + 1 'tr: total de toques al botón central.
        contador = contador + 1 'clics acumulados en el bloque actual (se reinicia cada 100 ciclos en timer 3 (cada 10,000 ms o 10 segundos)).
        Label2.Text = contador 'contador es igual a tr ambos guardad cuantos clicks se dan?,no?
        If tiempo_entrenamiento >= 10000 Then 'Si el tiempo de entrenamiento(desde que se epulso inicio ) llega a  10 segundos 
            'dado_rob()
            Randomize() 'Reiniciar el randomize
            'If dado_human = 1 Then ' Valor fuera de rango como bandera
            'Else
                dado_human = Int((6 * Rnd()) + 1) 'dado de 6 caras= 1 de cada 6 pulsos, en promedio, provoca que la tecla se apague
                Label1.Text = dado_human 'label1 toma el valor de daodo human
                If dado_human = 1 Then ' probabilidad de 75% de apagar la tecla(?) en realidad es 1/6
                    Button1.Enabled = False
                    permiso = False 'Bloquea la ejecucion de timer 3
                    ListBox3.SetSelected(ContadorDemora, True) 'ListBox3 contiene una lista de posibles tiempos de espera, Contador Demora es el indidice que selecciona un elemento de esta lista                           
                    ValorDemora = ListBox3.SelectedItem.ToString 'Esto es cuánto tarda en mostrar el estimulo humano
                    DemoraInicia = Environment.TickCount 'El momento en que se decidió que se debe esperar
                End If
            'End If
        End If
    End Sub

    Sub Cambio_estimuloH()
        CEH = CEH + 1 'cambios de estímulo han sido provocados por el comportamiento del usuario

        TXT.WriteLine(tiempo_entrenamiento & ";CE DEP;" & ListBox3.SelectedItem.ToString) 'Se guarda el número de CE DEP y el tiempo en milisegundos en que ocurrió'
        'Timer3.Stop() 'Timer3.Stop() pausa timer3 (posible pulso de la maquina)
        'Randomize()
        'dcolor = Int(2 * Rnd()) + 1 'Lanza un dado de 2 caras para decidir el paquete de botones
        'If dcolor = 1 Then
            'Paquete_1() 'se activa el paquete 1 (izq rojo| der verde)
        'Else
            'Paquete_2() 'se activa el paquete 2 (izq verde| der rojo)
        'End If
        dado_human = 4 'Evita volver a ejecutar la logica del bucle Do
        ListBox3.SetSelected(ContadorDemora, False) 'Deselecciona el valor de demora que se usó en esta ronda.
        ContadorDemora = ContadorDemora + 1 'Avanza el índice para que en el próximo cambio humano se use el siguiente valor de demora en ListBox3
        'BanderaD = False 'Creo que no hace nada
        Demora = 0 'se reinicia a 0 para que no interfiera en futuras mediciones.
    End Sub

    ' Function Dado_1() 'es un dado cuyo tamaño depende de cuántos clics hizo el participante
    '     Randomize()
    '     If b = 0 Then 'b es el numero de clicks en el bloque anterior, en la primera iteracion o si el usuario no da clics b = 0
    '         dado1 = 0 'por lo que dado1 = 0'
    '     Else
    '         dado1 = Int((100 / b * Rnd()) + 1) 'Int(100/100*0.0001+1) = 1'
    '                                             'Int(100/1*0.9999+1) = 100' 
    '         '(En todos los casos el minimo es 1 pero a menos clicks el numero maximo es mas alto)
    '     End If
    '     Return dado1
    ' End Function

    Sub Cambio_estimuloR()
        CER = CER + 1 'cambios de estímulo han sido provocados por el comportamiento de la maquina
        'Button1.Enabled = False 'Desactiva el boton central (eso no ocurre con el cambio_estimulo H osi ?)
        'Try
            TXT.Writeline(tiempo_entrenamiento & ";CE INDEP") 'Guarda el tiempo de netrenamiento y el CEI 
        'Catch
        'End Try
        'permiso = False 'deshabilita los permisos de timer_3
        'Timer3.Stop() 'deshabilita los pulsos '

        'Randomize() 'se reinicia el generador de numeros aleatorios
        'dcolor = Int(2 * Rnd()) + 1 'Se genera un numero aleatorio entre 0-1

        'If dcolor = 1 Then
            'Paquete_1() 'se activa el paquete 1 (izq rojo| der verde)
        'Else
            'Paquete_2() 'se activa el paquete 2 (izq verde| der rojo)
        'End If
    'End Sub

    ' Sub Paquete_1()
    '     BtnDerVer.Visible = True
    '     BotonIzqRoj.Visible = True
    '     Button1.BackColor = Color.Black
    '     BtnDerOff.Visible = False
    '     BtnIzqOff.Visible = False
    ' End Sub

    ' Sub Paquete_2()
    '     BtnDerRoj.Visible = True
    '     BotonVer.Visible = True
    '     Button1.BackColor = Color.Black
    '     BtnDerOff.Visible = False
    '     BtnIzqOff.Visible = False
    ' End Sub

    Private Sub BtnDerVer_Click_1(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles BtnDerVer.Click
        'verde = verde + 1
        'derecha = derecha + 1
        'If dado_rob = 2 Then ' Si el cambio fue generado por la máquina
            'Errores = Errores + 1 '' Se considera error
            TXT.WriteLine(tiempo_entrenamiento & ";derecha" & ";verde" & ";Error") ' Se registra como error en el archivo
            Blackout() '' Se aplica castigo visual
        Else
            Aciertos = Aciertos + 1 ' Se considera acierto
            TXT.WriteLine(tiempo_entrenamiento & ";derecha" & ";verde" & ";Acierto") '' Se registra como acierto
            Reforzar()  ' Se aplica reforzamiento visual
        End If
    End Sub

    ' Private Sub BtnDerRoj_Click_1(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles BtnDerRoj.Click
    '     rojo = rojo + 1
    '     derecha = derecha + 1
    '     If dado_rob = 2 Then
    '         Aciertos = Aciertos + 1
    '         TXT.WriteLine(tiempo_entrenamiento & ";derecha" & ";rojo" & ";Acierto")
    '         Reforzar()
    '     Else
    '         Errores = Errores + 1
    '         TXT.WriteLine(tiempo_entrenamiento & ";derecha" & ";rojo" & ";Error")
    '         Blackout()
    '     End If
    ' End Sub


    ' Private Sub BotonVer_Click_1(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles BotonVer.Click
    '     izquierda = izquierda + 1
    '     verde = verde + 1
    '     If dado_rob = 2 Then
    '         Errores = Errores + 1
    '         TXT.WriteLine(tiempo_entrenamiento & ";izquierda" & ";verde" & ";Error")
    '         Blackout()
    '     Else
    '         Aciertos = Aciertos + 1
    '         TXT.WriteLine(tiempo_entrenamiento & ";izquierda" & ";verde" & ";Acierto")
    '         Reforzar()
    '     End If
    ' End Sub

    ' Private Sub BotonIzqRoj_Click_1(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles BotonIzqRoj.Click
    '     rojo = rojo + 1
    '     izquierda = izquierda + 1
    '     If dado_rob = 2 Then
    '         Aciertos = Aciertos + 1
    '         TXT.WriteLine(tiempo_entrenamiento & ";izquierda" & ";rojo" & ";Acierto")
    '         Reforzar()
    '     Else
    '         Errores = Errores + 1
    '         TXT.WriteLine(tiempo_entrenamiento & ";izquierda" & ";rojo" & ";Error")
    '         Blackout()
    '     End If
    ' End Sub

    Sub Reforzar() 'Se ejecurta cuando el sujero acierta
        TXT.WriteLine(tiempo_entrenamiento & ";R+") ' Registra reforzamiento

        score = (CEH + CER) 'Total de oportunidades
        promedio = Math.Round((Aciertos / score) * 100)  ' Calcula porcentaje de aciertos
        If promedio = 100 Then
            Labelscore.Text = ("Tienes un " & " " & promedio & "% " & " " & "de aciertos")
        Else
            Labelscore.Text = ("Tu precisión aumentó al " & " " & promedio & "% ")
        End If

        ' Oculta botones de respuesta
        ' Button1.Visible = False
        ' BotonIzqRoj.Visible = False
        ' BotonVer.Visible = False
        ' BtnDerVer.Visible = False
        ' BtnDerRoj.Visible = False

        ' Muestra reforzamiento visual
        'PictureBox1.Visible = True
        Labelscore.Visible = True

        ' Espera 2.5 segundos (30 ticks)
        ' Timer1.Start()
        ' Do
        '     If Duracion_Ref >= 30 Then Exit Do '<- Aqui esta la duración del reforzamiento 2.5s

        '     My.Application.DoEvents()
        ' Loop
        'dado_rob = 5
        'Duracion_Ref = 0
        'Timer1.Stop()
        'PictureBox1.Visible = False
        Labelscore.Visible = False

        ' Button1.BackColor = Color.White
        ' BtnIzqOff.Visible = True
        ' BtnDerOff.Visible = True

        ' Button1.BackColor = Color.White
        ' BtnIzqOff.Visible = True
        ' BtnDerOff.Visible = True
        ' Button1.Visible = True
        ' Button1.Enabled = True

        If score = 150 Then

            Me.BackColor = Color.White
            gpp.Visible = True

            Labelscore.Visible = True
            Labelscore.Text = ("Tu porcentaje de aciertos total fue del " & " " & promedio & "% ")

            ' BtnDerOff.Visible = False
            ' BtnIzqOff.Visible = False
            ' Button1.Visible = False
            ' BotonIzqRoj.Visible = False
            ' BotonVer.Visible = False
            ' BtnDerVer.Visible = False
            ' BtnDerRoj.Visible = False

            TXT.WriteLine("Respuestas totales al boton central:" & ";" & tr)
            TXT.WriteLine("Pulsos totales máquina" & ";" & pr)
            TXT.WriteLine("Aciertos:" & ";" & Aciertos)
            TXT.WriteLine("Errores:" & ";" & Errores)
            TXT.WriteLine("Cambios de Estimulo Dependientes:" & ";" & CEH)
            TXT.WriteLine("Cambios de Estimulo Independientes:" & ";" & CER)
            TXT.WriteLine("Veces que eligió izquierda:" & ";" & izquierda)
            TXT.WriteLine("Veces que eligió derecha:" & "," & derecha)
            TXT.WriteLine("Veces que eligió verde:" & "," & verde)
            TXT.WriteLine("Veces que eligió rojo:" & "," & rojo)
            TXT.WriteLine("Pulsos totales máquina" & "," & pr)
            TXT.Close()
            Me.Close()
        End If

        Timer3.Start()
        permiso = True
    End Sub

    Sub Blackout()
        TXT.WriteLine(tiempo_entrenamiento & ";BO")
        score = (CEH + CER)
        promedio = Math.Round((Aciertos / score) * 100)

        Labelscore.Text = ("Tu porcentaje de aciertos bajó al " & " " & promedio & "%")

        ' Button1.Visible = False
        ' BotonIzqRoj.Visible = False
        ' BotonVer.Visible = False
        ' BtnDer.Visible = False
        ' BtnDerRoj.Visible = False
        ' EBO.Visible = True
        ' Labelscore.Visible = True
        ' Timer1.Start()
        ' Do
        ' Labelscore.Visible = True
        ' Timer1.Start()
        ' Do
        '     If Duracion_Ref >= 30 Then Exit Do '<- Aqui esta la duración del reforzamiento 2.5s
        '     My.Application.DoEvents()
        ' Loop
        'dado_rob = 5
        Duracion_Ref = 0
        Timer1.Stop()
        EBO.Visible = False
        ' Labelscore.Visible = False

        ' Button1.BackColor = Color.White
        ' Button1.Visible = True
        ' BtnIzqOff.Visible = True
        ' BtnDerOff.Visible = True
        ' Button1.Enabled = True

        If score = 150 Then
            Me.BackColor = Color.WhiteSmoke
            gpp.Visible = True
  

            Labelscore.Visible = True
            Labelscore.Text = ("Tu porcentaje de aciertos total fue del " & " " & promedio & "%")

            Labelscore.Visible = True
            Labelscore.Text = ("Tu porcentaje de aciertos total fue del " & " " & promedio & "% ")

            ' BtnDerOff.Visible = False
            ' BtnIzqOff.Visible = False
            ' Button1.Visible = False
            ' BotonIzqRoj.Visible = False
            ' BotonVer.Visible = False
            ' BtnDerVer.Visible = False
            ' BtnDerRoj.Visible = False

            TXT.WriteLine("Respuestas totales al boton central:" & ";" & tr)
            TXT.WriteLine("Pulsos totales máquina" & ";" & pr)
            TXT.WriteLine("Aciertos:" & ";" & Aciertos)
            TXT.WriteLine("Errores:" & ";" & Errores)
            TXT.WriteLine("Cambios de Estimulo Dependientes:" & ";" & CEH)
            TXT.WriteLine("Cambios de Estimulo Independientes:" & ";" & CER)
            TXT.WriteLine("Veces que eligió izquierda:" & ";" & izquierda)
            TXT.WriteLine("Veces que eligió derecha:" & ";" & derecha)
            TXT.WriteLine("Veces que eligió verde:" & ";" & verde)
            TXT.WriteLine("Veces que eligió rojo:" & ";" & rojo)
            XT.WriteLine("Pulsos totales máquina" & "," & pr)
            TXT.Close()
            'Me.Close()
        End If
        
        Timer3.Start()
        permiso = True
    End Sub

  

    ' Private Sub Timer1_Tick(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles Timer1.Tick
    '     Duracion_Ref = Duracion_Ref + 1
    '     Label3.Text = Duracion_Ref
    ' End Sub


    'Private Sub Timer3_Tick(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles Timer3.Tick 'simula los pulsos de la maquina
        'n = n + 1 'Cada que timer 3 se ejecuta se incrementa n en 1 (contador de ciclos)
        'Label5.Text = n 
        'If permiso = True Then 'solo genera pulsos si permiso está activado(evita que se generen estímulos durante el reforzamiento) aqui puedes ver cuando se bloquean pulsos de maquina
            'Dado_1() 'Solo si el resultado es exactamente 1,
            'Label7.Text = dado1
            'If dado1 = 1 Then
                'Randomize()
                'dado_rob = Int(18 * Rnd() + 1) ' Dado de 18 caras, en promedio, uno de cada 18 pulsos de la computadora provocará que la tecla se apague
                'pr = pr + 1 '(contador de intentos de apagado).
                'Label8.Text = dado_rob
                'If dado_rob = 2 Then ' ' Solo si dado1 = 1 (probabilidad depende de b), se lanza dado_rob
                                        ' dado_rob tiene 1/18 ≈ 5.5% de probabilidad de activar el cambio
                                        ' Probabilidad total = P(dado1 = 1) × (1/18)
                    'Cambio_estimuloR()
                'End If
            'End If
        'End If
        'If n >= 100 Then
            'b = contador 'cada 10 segundos se guarda el numero de clicks
            'n = 0 'se reinicia n
            'Label6.Text = "Click dados en el bloque anterior" & b
            'contador = 0 'El contador otra vez cambia a 0
        'End If
    'End Sub

