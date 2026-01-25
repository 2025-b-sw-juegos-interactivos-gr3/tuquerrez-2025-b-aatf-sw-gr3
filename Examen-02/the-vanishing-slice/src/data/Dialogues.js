/**
 * SISTEMA DE DIÁLOGOS - THE VANISHING
 * Basado en el Capítulo 1 del GDD: "The Great Storm"
 * 
 * Estructura de cada nodo:
 * - speaker: Nombre del NPC que habla
 * - text: Texto del diálogo
 * - options: Array de opciones disponibles
 *   - text: Texto que ve el jugador
 *   - next: ID del siguiente nodo
 *   - relationshipChange: Puntos a sumar/restar (-100 a +100)
 */

export const dialogueData = {
    // Nodo Inicial - Primera conversación con Harold
    initial: {
        speaker: "Harold Greenfield",
        text: "Vaya golpe que te diste, no te preocupes, el viejo doctor te arregló rápido. Estás en Cold Pass, muchacho, aquí no hay más que un pequeño pueblo.",
        options: [
            {
                text: "¿Dónde estoy? ¿Qué pasó?",
                next: "confused",
                relationshipChange: 0
            },
            {
                text: "Gracias por salvarme. Estoy en deuda con ustedes.",
                next: "grateful_start",
                relationshipChange: 15
            },
            {
                text: "¡Necesito irme de inmediato! ¿Dónde está el puerto más cercano?",
                next: "urgent_start",
                relationshipChange: -10
            }
        ]
    },

    // Rama 1: Jugador confundido
    confused: {
        speaker: "Anna Greenfield",
        text: "Fuiste arrastrado a la orilla después de la gran tormenta, querido. Te encontramos inconsciente en la playa cerca de Cold Harbor. Has estado descansando durante dos semanas.",
        options: [
            {
                text: "¿¡Dos semanas!? Estaba viajando a Dallion por comercio...",
                next: "dallion_mention",
                relationshipChange: 0
            },
            {
                text: "Disculpa mi confusión. Gracias a ambos por su amabilidad.",
                next: "grateful_recovery",
                relationshipChange: 10
            }
        ]
    },

    // Rama 2: Jugador agradecido desde el inicio
    grateful_start: {
        speaker: "Anna Greenfield",
        text: "Oh, de nada, querido. No podíamos simplemente dejarte en esa playa. Harold te encontró durante su patrulla matutina. La tormenta fue feroz esa noche.",
        options: [
            {
                text: "¿Cómo puedo pagarles su amabilidad?",
                next: "offer_help",
                relationshipChange: 20
            },
            {
                text: "Es bueno saberlo. ¿Dónde exactamente está Cold Pass?",
                next: "location_ask",
                relationshipChange: 5
            }
        ]
    },

    // Rama 3: Jugador urgente/agresivo
    urgent_start: {
        speaker: "Harold Greenfield",
        text: "Tranquilo, muchacho. Recibiste un buen golpe en la cabeza. El doctor dice que necesitas descansar antes de viajar a cualquier lugar. ¿A dónde ibas con tanta prisa?",
        options: [
            {
                text: "Lo siento. Tienes razón, debería descansar primero.",
                next: "apologize_calm",
                relationshipChange: 5
            },
            {
                text: "¡No tengo tiempo para esto! ¡Solo dime dónde están los muelles!",
                next: "aggressive_insist",
                relationshipChange: -20
            }
        ]
    },

    // Mención de Dallion (Rama Confundido)
    dallion_mention: {
        speaker: "Harold Greenfield",
        text: "¿Dallion? Nunca he oído hablar de ese lugar. ¿Estás seguro de que ese golpe no te confundió la memoria, muchacho? ¿Qué opinas, Anna?",
        options: [
            {
                text: "Tal vez tengas razón... mi cabeza se siente confusa.",
                next: "accept_confusion",
                relationshipChange: 5
            },
            {
                text: "¡No, estoy seguro! ¡Es un importante centro comercial!",
                next: "insist_dallion",
                relationshipChange: -5
            }
        ]
    },

    // Jugador se recupera con gratitud
    grateful_recovery: {
        speaker: "Harold Greenfield",
        text: "No hay de qué preocuparse, muchacho. Eso es lo que hacen los vecinos en Cold Pass. Ahora, cuando te sientas listo, hay gente en el pueblo que podría saber más sobre... bueno, sobre sucesos extraños últimamente.",
        options: [
            {
                text: "¿Sucesos extraños? ¿A qué te refieres?",
                next: "mystery_intro",
                relationshipChange: 5
            },
            {
                text: "Me gustaría ayudar al pueblo si puedo.",
                next: "offer_help",
                relationshipChange: 15
            }
        ]
    },

    // Jugador ofrece ayuda
    offer_help: {
        speaker: "Anna Greenfield",
        text: "Es muy amable de tu parte, querido. La gente ha estado... desapareciendo. Buenas personas, desapareciendo sin dejar rastro. El alcalde está muy preocupado.",
        options: [
            {
                text: "Hablaré con el alcalde y veré qué puedo hacer.",
                next: "accept_quest",
                relationshipChange: 25
            },
            {
                text: "Eso suena peligroso. Debería concentrarme en volver a casa.",
                next: "decline_help",
                relationshipChange: -15
            }
        ]
    },

    // Pregunta por ubicación
    location_ask: {
        speaker: "Harold Greenfield",
        text: "Cold Pass es un pequeño pueblo pesquero en la Isla High Reach. Estamos un poco aislados del continente, pero nos las arreglamos. El Cold Harbor alimenta a toda la población.",
        options: [
            {
                text: "Isla High Reach... Nunca he oído hablar de ella.",
                next: "island_unknown",
                relationshipChange: 0
            },
            {
                text: "Parece un lugar tranquilo.",
                next: "compliment_town",
                relationshipChange: 10
            }
        ]
    },

    // Jugador se disculpa
    apologize_calm: {
        speaker: "Anna Greenfield",
        text: "Eso es mejor, querido. Has pasado por un gran ordeal. ¿Por qué no descansas otro día y podemos hablar sobre cómo ayudarte a encontrar el camino mañana?",
        options: [
            {
                text: "Tienes razón. Gracias por entender.",
                next: "peaceful_end",
                relationshipChange: 15
            },
            {
                text: "En realidad, me siento mejor. ¿Qué puedes decirme sobre este pueblo?",
                next: "location_ask",
                relationshipChange: 5
            }
        ]
    },

    // Jugador insiste agresivamente
    aggressive_insist: {
        speaker: "Harold Greenfield",
        text: "¡Escucha! Te salvamos la vida, ¿y así es como nos hablas? La puerta está ahí si quieres tambalearte en tu estado. Buena suerte encontrando ayuda en otro lugar.",
        options: [
            {
                text: "Espera... lo siento. Estoy preocupado por mi carga.",
                next: "apologize_late",
                relationshipChange: 0
            },
            {
                text: "[No decir nada y salir]",
                next: "hostile_end",
                relationshipChange: -30
            }
        ]
    },

    // Acepta confusión
    accept_confusion: {
        speaker: "Anna Greenfield",
        text: "No te preocupes, querido. La memoria puede jugar trucos después de un trauma así. Dale tiempo. Mientras tanto, eres bienvenido a quedarte con nosotros hasta que te recuperes.",
        options: [
            {
                text: "Ustedes han sido tan amables. ¿Cómo puedo ayudar en el pueblo?",
                next: "offer_help",
                relationshipChange: 15
            }
        ]
    },

    // Insiste en Dallion
    insist_dallion: {
        speaker: "Harold Greenfield",
        text: "Bueno, si tú lo dices. Quizás el alcalde sepa algo. Él ha viajado más que la mayoría de nosotros. Deberías hablar con él cuando estés listo.",
        options: [
            {
                text: "Haré eso. Gracias.",
                next: "neutral_end",
                relationshipChange: 0
            }
        ]
    },

    // Introducción al misterio
    mystery_intro: {
        speaker: "Harold Greenfield",
        text: "Personas desapareciendo en la noche. Sin cuerpos, sin signos de lucha. Simplemente... desaparecidos. Empezó hace tres semanas, justo antes de la tormenta que te trajo aquí.",
        options: [
            {
                text: "Eso es terrible. Investigaré si puedo ayudar.",
                next: "accept_quest",
                relationshipChange: 20
            },
            {
                text: "Parece que llegué en un mal momento...",
                next: "nervous_response",
                relationshipChange: -5
            }
        ]
    },

    // Acepta la quest
    accept_quest: {
        speaker: "Anna Greenfield",
        text: "Que Dios te bendiga, querido. El alcalde querrá hablar contigo. Su oficina está en el centro del pueblo. Pero primero, visita al herrero - necesitarás una armadura adecuada si te aventuras en peligro.",
        options: []  // Final del diálogo - Sin opciones termina la conversación
    },

    // Rechaza ayudar
    decline_help: {
        speaker: "Harold Greenfield",
        text: "Hmph. Bueno, todos cuidamos de los nuestros, supongo. El alcalde podría ayudarte a encontrar un pasaje fuera de la isla... por un precio.",
        options: []
    },

    // Isla desconocida
    island_unknown: {
        speaker: "Harold Greenfield",
        text: "Sí, estamos un poco fuera de las rutas comerciales habituales. La mayoría de la gente no sabe que existimos a menos que estén pescando en estas aguas. Hace que los recientes problemas sean aún más preocupantes.",
        options: [
            {
                text: "¿Qué problemas?",
                next: "mystery_intro",
                relationshipChange: 5
            }
        ]
    },

    // Elogia el pueblo
    compliment_town: {
        speaker: "Anna Greenfield",
        text: "Era pacífico... hasta hace poco. Pero tenemos esperanza de que las cosas vuelvan a la normalidad. Aquí viven buenas personas.",
        options: [
            {
                text: "Me gustaría ayudar si puedo.",
                next: "offer_help",
                relationshipChange: 10
            }
        ]
    },

    // Disculpa tardía
    apologize_late: {
        speaker: "Harold Greenfield",
        text: "Tu carga está en el fondo del mar, muchacho. La tormenta se llevó todo. Pero si te humillas y ayudas a este pueblo, tal vez encuentres una manera de empezar de nuevo.",
        options: [
            {
                text: "Tienes razón. Lo siento por mi grosería.",
                next: "redemption_path",
                relationshipChange: 10
            }
        ]
    },

    // Final hostil
    hostile_end: {
        speaker: "Harold Greenfield",
        text: "[Harold te da la espalda] Anna, muéstrale la salida. No tengo paciencia para extraños ingratos.",
        options: []
    },

    // Final pacífico
    peaceful_end: {
        speaker: "Harold Greenfield",
        text: "Descansa un poco. Mañana te presentaremos adecuadamente a Cold Pass. Bienvenido a la Isla High Reach, extraño.",
        options: []
    },

    // Final neutral
    neutral_end: {
        speaker: "Anna Greenfield",
        text: "La oficina del alcalde está en la plaza del pueblo. Cuídate allá afuera - estos son tiempos extraños.",
        options: []
    },

    // Respuesta nerviosa
    nervous_response: {
        speaker: "Harold Greenfield",
        text: "Mal momento o no, ahora estás aquí. Y si quieres nuestra ayuda para encontrar un barco fuera de esta isla, quizás deberías considerar ayudar con nuestros problemas primero.",
        options: [
            {
                text: "Es justo. Ayudaré.",
                next: "accept_quest",
                relationshipChange: 15
            }
        ]
    },

    // Camino de redención
    redemption_path: {
        speaker: "Anna Greenfield",
        text: "Todos merecen una segunda oportunidad, querido. El ladrido de Harold es peor que su mordida. Ven, déjame mostrarte adecuadamente.",
        options: [
            {
                text: "Gracias. No olvidaré esta amabilidad.",
                next: "peaceful_end",
                relationshipChange: 20
            }
        ]
    }
};